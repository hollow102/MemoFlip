import { Controller } from './controllers/controller';
import { View } from './views';

function bootstrap(): void {
  const view = new View(document);
  const controller = new Controller(view);
  void controller.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
