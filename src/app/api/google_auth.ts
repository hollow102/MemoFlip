import {
  clearGoogleAccessToken,
  getGoogleAccessTokenRecord,
  isGoogleAccessTokenValid,
  setGoogleAccessToken,
} from '../storages';

const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

interface FileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  shortcutDetails?: { targetId: string; targetMimeType: string };
}

export interface DriveJsonFile {
  id: string;
  name: string;
  modifiedTime?: string;
  content: unknown;
}

async function getMeta(accessToken: string, fileId: string): Promise<FileMeta> {
  const url =
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
    '?fields=id,name,mimeType,modifiedTime,shortcutDetails';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new Error(`files.get(meta) failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** フォルダ配下のファイル一覧（ページネーション対応）。 */
export async function listFilesInFolder(
  accessToken: string,
  folderId: string,
): Promise<FileMeta[]> {
  const files: FileMeta[] = [];
  let pageToken: string | undefined;
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);

  do {
    const url =
      'https://www.googleapis.com/drive/v3/files' +
      `?q=${q}` +
      '&fields=nextPageToken,files(id,name,mimeType,modifiedTime,shortcutDetails)' +
      '&orderBy=name' +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      throw new Error('フォルダーが見つかりませんでした。');
    }

    const data: { files?: FileMeta[]; nextPageToken?: string } = await res.json();
    if (data.files?.length) files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

/** ショートカットなら本体へ解決し、Docs 系（alt=media 不可）は除外する。 */
async function resolveDownloadableId(
  accessToken: string,
  meta: FileMeta,
): Promise<{ id: string; name: string; mimeType: string } | null> {
  if (meta.mimeType === 'application/vnd.google-apps.shortcut' && meta.shortcutDetails?.targetId) {
    const real = await getMeta(accessToken, meta.shortcutDetails.targetId);
    if (real.mimeType.startsWith('application/vnd.google-apps.')) return null;
    return { id: real.id, name: real.name, mimeType: real.mimeType };
  }
  if (meta.mimeType.startsWith('application/vnd.google-apps.')) return null;
  return { id: meta.id, name: meta.name, mimeType: meta.mimeType };
}

/** バイナリ実体ファイルの JSON を取得する（application/json 前提）。 */
export async function fetchFileJson(accessToken: string, fileId: string): Promise<unknown> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`files.get (alt=media) failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** フォルダ内の JSON 実体ファイルを全件読み込む。 */
export async function fetchAllJsonFromFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveJsonFile[]> {
  const metas = await listFilesInFolder(accessToken, folderId);

  const downloadable = (
    await Promise.all(metas.map((m) => resolveDownloadableId(accessToken, m)))
  ).filter((x): x is { id: string; name: string; mimeType: string } => !!x);

  const jsonFiles = downloadable.filter(
    (x) => x.mimeType === 'application/json' || x.mimeType === 'application/octet-stream',
  );

  return Promise.all(
    jsonFiles.map(async (f) => {
      const content = await fetchFileJson(accessToken, f.id);
      const meta = metas.find((m) => m.id === f.id || m.shortcutDetails?.targetId === f.id);
      return { id: f.id, name: f.name, modifiedTime: meta?.modifiedTime, content };
    }),
  );
}

/** フォルダ内で指定名のファイルを 1 件検索する（drive.file スコープ＝自アプリ作成分が対象）。 */
export async function findFileByName(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<{ id: string } | null> {
  const q = encodeURIComponent(`name='${fileName}' and '${folderId}' in parents and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new Error(`files.list failed: ${res.status} ${res.statusText}`);
  }
  const data: { files?: { id: string }[] } = await res.json();
  return data.files?.[0] ?? null;
}

/** 指定フォルダに新規 JSON ファイルを作成する（multipart upload）。 */
export async function createFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: unknown,
): Promise<{ id: string }> {
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  });
  const body = JSON.stringify(content);
  const boundary = 'memoflip_boundary_' + Date.now();
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    },
  );
  if (!res.ok) {
    throw new Error(`files.create failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<{ id: string }>;
}

/** 既存ファイルの内容を更新する（media upload）。 */
export async function updateFileContent(
  accessToken: string,
  fileId: string,
  content: unknown,
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    },
  );
  if (!res.ok) {
    throw new Error(`files.update failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * 有効なトークンがあれば再利用し、なければ GIS のサイレント発行を試みる。
 * interactive=true のときのみ、サイレント失敗時にサインイン UI へフォールバックする。
 */
export async function getValidAccessToken(
  clientId: string,
  opts: { loginHint?: string; interactive: boolean },
): Promise<string> {
  const cached = getGoogleAccessTokenRecord();
  if (isGoogleAccessTokenValid(cached)) return cached.token;

  try {
    return await requestToken(clientId, { prompt: '', loginHint: opts.loginHint });
  } catch (silentError) {
    if (!opts.interactive) {
      clearGoogleAccessToken();
      throw silentError;
    }
    return await requestToken(clientId, { loginHint: opts.loginHint });
  }
}

export function invalidateGoogleAccessToken(): void {
  clearGoogleAccessToken();
}

function requestToken(
  clientId: string,
  opts: { prompt?: '' | 'consent' | 'select_account' | 'none'; loginHint?: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google.accounts?.oauth2) {
      reject(new Error('Google Identity Services が読み込まれていません。'));
      return;
    }
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        prompt: opts.prompt,
        login_hint: opts.loginHint,
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.error || !response.access_token) {
            reject(
              new Error(
                response.error_description ||
                  response.error ||
                  'アクセストークンの取得に失敗しました。',
              ),
            );
            return;
          }
          const expiresIn = Number(response.expires_in);
          if (Number.isFinite(expiresIn) && expiresIn > 0) {
            setGoogleAccessToken(response.access_token, expiresIn);
          }
          resolve(response.access_token);
        },
        error_callback: (err) => {
          reject(new Error(err.message || err.type || 'auth_error'));
        },
      });
      tokenClient.requestAccessToken({ prompt: opts.prompt });
    } catch (err) {
      reject(err);
    }
  });
}
