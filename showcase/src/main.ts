import { router } from './router';
import { renderHome } from './pages/home';
import { renderDemoList } from './pages/demo-list';
import { renderDemo } from './pages/demo';
import { renderDocs } from './pages/docs';

// Register routes
router.route('/', renderHome);
router.route('/demos', renderDemoList);
router.route('/demo/:id', renderDemo);
router.route('/docs', renderDocs);

// Start the router
router.start();
