document.addEventListener("DOMContentLoaded", function () {
  const issuesList = document.querySelector(".issues-list");
  const countElement = document.getElementById("count");
  const issueTitleInput = document.getElementById("todo-input");
  const issueBodyInput = document.getElementById("issue-body");
  const updateOverlay = document.getElementById("updateOverlay");
  const updateTitleInput = document.getElementById("update-title");
  const updateBodyInput = document.getElementById("update-body");
  let currentIssueNumber = null;

  // Define the API URL variable
  const apiUrl = "http://localhost:3000/api/issues";

  // Function to show toast notification
  function showToast(message, type) {
    Toastify({
      text: message,
      duration: 3000,
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
      },
      onClick: function () {},
    }).showToast();
  }
  // Function to fetch issues from the server
  async function fetchIssues() {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      displayIssues(data);
    } catch (error) {
      console.error("Error fetching issues:", error.message);
    }
  }

  // Function to display fetched issues
  function displayIssues(issues) {
    issuesList.innerHTML = "";

    issues.forEach((issue) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `
            <div class="issue-header ${
              issue.state === "closed" ? "completed" : ""
            }" data-issue-status="${issue.state}">
                <div>
                    <h1><span class="placeholder">Title</span>: ${
                      issue.title
                    }</h1>
                    <p><span class="placeholder">Description</span>: ${
                      issue.body
                    }</p>
                </div>
                <div class="issue-actions">
                    <button class="is-completed-btn" onclick="markAsCompleted(${
                      issue.number
                    })">Is Completed</button>
                    <button class="update-issue-btn" onclick="openUpdateOverlay(${
                      issue.number
                    })">Update</button>
                    <button class="delete-issue-btn" onclick="deleteIssue(${
                      issue.number
                    })">Delete</button>
                </div>
            </div>
        `;
      listItem.setAttribute("data-issue-number", issue.number);
      listItem.setAttribute("data-status", issue.state);
      issuesList.appendChild(listItem);
    });

    updateActiveCount();
  }

  // Function to update the count of active issues
  function updateActiveCount() {
    const activeIssues = document.querySelectorAll(".issues-list li");
    countElement.innerText = activeIssues.length;
  }

  // Event listener for form submission (creating a new issue)
  window.handleCreateIssue = function () {
    const title = issueTitleInput.value;
    const body = issueBodyInput.value;
    if (title && body) {
      createIssue(title, body);
    }
  };

  // Function to create a new issue
  async function createIssue(title, body) {
    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      });
      fetchIssues();
      issueTitleInput.value = "";
      issueBodyInput.value = "";
      showToast("Issue created successfully", "success");
    } catch (error) {
      console.error("Error creating issue:", error.message);
      showToast("Error creating issue", "error");
    }
  }

  // Function to open the update overlay
  window.openUpdateOverlay = function (issueNumber) {
    currentIssueNumber = issueNumber;

    // Fetch the current issue details
    fetchIssueDetails(issueNumber)
      .then((issue) => {
        // Check if the elements exist before attempting to set values
        if (updateTitleInput && updateBodyInput) {
          updateTitleInput.value = issue && issue.title ? issue.title : "";
          updateBodyInput.value = issue && issue.body ? issue.body : "";
          updateOverlay.style.display = "flex";
        } else {
          showToast("Error: Update overlay elements not found", "error");
        }
      })
      .catch((error) => {
        console.error(
          `Error fetching details for issue ${issueNumber}:`,
          error.message
        );
        showToast("Error fetching issue details", "error");
      });
  };

  // Function to close the update overlay
  window.closeUpdateOverlay = function () {
    currentIssueNumber = null;
    updateOverlay.style.display = "none";
  };

  // Function to fetch details of a specific issue
  async function fetchIssueDetails(issueNumber) {
    try {
      const response = await fetch(`${apiUrl}/${issueNumber}`);
      if (!response.ok) {
        console.error(
          `Error fetching details for issue ${issueNumber}: ${response.statusText}`
        );
        throw new Error("Issue details not found");
      }
      const issue = await response.json();
      return issue;
    } catch (error) {
      console.error(
        `Error fetching details for issue ${issueNumber}:`,
        error.message
      );
      throw error;
    }
  }

  // Function to update an issue
  window.updateIssue = async function () {
    const newTitle = updateTitleInput.value;
    const newBody = updateBodyInput.value;
    if (newTitle || newBody) {
      try {
        await fetch(`${apiUrl}/${currentIssueNumber}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle, body: newBody }),
        });

        // Fetch the updated list of issues
        fetchIssues();

        closeUpdateOverlay();
        showToast("Issue updated successfully", "success");
      } catch (error) {
        console.error(
          `Error updating issue ${currentIssueNumber}:`,
          error.message
        );
        showToast("Error updating issue", "error");
      }
    }
  };

  // Function to delete an issue
  window.deleteIssue = async function (issueNumber) {
    try {
      await fetch(`${apiUrl}/${issueNumber}`, {
        method: "DELETE",
      });
      fetchIssues();
      showToast("Issue deleted successfully", "success");
    } catch (error) {
      console.error(`Error deleting issue ${issueNumber}:`, error.message);
      showToast("Error deleting issue", "error");
    }
  };

  // Event listener for filter buttons
  const allFilterBtn = document.querySelector('.filter-btn.all');
  allFilterBtn.addEventListener('click', () => filterIssues('all'));  

  const activeFilterBtn = document.querySelector(".filter-btn.active");
  activeFilterBtn.addEventListener("click", () => filterIssues("active"));

  const completedFilterBtn = document.querySelector(".filter-btn.completed");
  completedFilterBtn.addEventListener("click", () => filterIssues("completed"));

  // Event listener for "Clear Completed" link
  const clearCompletedBtn = document.querySelector(".clear-issues");
  clearCompletedBtn.addEventListener("click", clearCompletedIssues);

  function clearCompletedIssues() {
    const completedIssues = document.querySelectorAll(
      '.issues-list li[data-status="closed"]'
    );
    completedIssues.forEach((issueElement) => {
      const issueNumber = issueElement.dataset.issueNumber;
      deleteIssue(issueNumber);
    });
  }

  window.markAsCompleted = function (issueNumber) {
    const issueElement = document.querySelector(
      `.issues-list li[data-issue-number="${issueNumber}"]`
    );

    if (issueElement) {
      const currentStatus = issueElement.getAttribute("data-status");

      if (currentStatus === "open") {
        // Mark as completed
        issueElement.setAttribute("data-status", "closed");
        issueElement.style.opacity = "0.5";
        showToast(`Issue ${issueNumber} marked as completed`, "success");
      } else {
        // Unmark as ForAnotherChanges
        issueElement.setAttribute("data-status", "open");
        issueElement.style.opacity = "1";
        showToast(`Issue ${issueNumber} marked as active`, "success");
      }
    } else {
      showToast(`Issue ${issueNumber} not found`, "error");
    }

    // Update issue visibility based on the current filter
    const currentFilter = document.querySelector(".filter-btn.active");
    filterIssues(currentFilter.dataset.status);
    updateActiveCount();
  };

// Function to filter issues based on status
window.filterIssues = function(status) {
    const issues = document.querySelectorAll('.issues-list li');

    issues.forEach(issue => {
        const issueStatus = issue.getAttribute('data-status');

        switch (status) {
            case 'all':
                issue.style.display = 'block';
                break;
            case 'active':
                issue.style.display = issueStatus === 'open' ? 'block' : 'none';
                break;
            case 'completed':
                issue.style.display = issueStatus === 'closed' ? 'block' : 'none';
                break;
        }
    });

    updateActiveCount();
};
  fetchIssues();
});
