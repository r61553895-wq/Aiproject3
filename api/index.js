import appModule from './index.cjs';

const app = appModule.default || appModule;

export default function handler(req, res) {
  return app(req, res);
}
