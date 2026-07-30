import { savePostAction } from './src/app/actions';

// Import the plugins so they register their hooks
import './src/plugins/example';
import './src/plugins/revisions';

async function runTest() {
  const postData = {
    title: 'my awesome plugin post',
    content: 'This is a test of the hook system'
  };

  const result = await savePostAction(postData);
  console.log('Final Result:', result);
}

runTest();
