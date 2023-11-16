const express = require('express');
const { Octokit } = require('@octokit/core');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.static('public'));

const octokit = new Octokit({
  auth: process.env.ACCESS_TOKEN,
});

const owner = process.env.OWNER;
const repo = process.env.REPO;


//get allIssues Route
app.get('/api/issues', async (req, res) => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//get issues ById Route
app.get('/api/issues/:issueNumber', async (req, res) => {
  const { issueNumber } = req.params;

  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      owner,
      repo,
      issue_number: issueNumber,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching issue ${issueNumber}:`, error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Create Issue Route
app.post('/api/issues', express.json(), async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner,
      repo,
      title,
      body,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating issue:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Update issue Route
app.patch('/api/issues/:issueNumber', express.json(), async (req, res) => {
  const { issueNumber } = req.params;
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const response = await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner,
      repo,
      issue_number: issueNumber,
      title,
      body,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating issue:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.delete('/api/issues/:issueNumber', async (req, res) => {
  const { issueNumber } = req.params;

  try {
    await deleteIssue(issueNumber);
    res.status(204).send({ sucess: 'issue deleted successfully' }); 
  } catch (error) {
    console.error(`Error deleting issue #${issueNumber}:`, error.message);

    if (error.status === 404) {
      res.status(404).json({ error: 'Issue not found' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Function to close and lock an issue
async function deleteIssue(issueNumber) {
  try {
    const response = await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner,
      repo,
      issue_number: issueNumber,
      state: 'closed',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    console.log('Octokit Response:', response);

    if (response.status === 200) {
      console.log(`Issue #${issueNumber} successfully closed.`);
    } else {
      console.error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting issue #${issueNumber}:`, error.message);
    throw error; 
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
