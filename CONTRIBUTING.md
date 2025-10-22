# Contributing to Real-Time ChatApp

We're thrilled that you're interested in contributing to ChatApp! This project is participating in Hacktoberfest, and we welcome contributions from everyone.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before you start.

## How to Contribute

There are many ways to contribute, from reporting bugs to submitting new features.

* **Reporting Bugs:** If you find a bug, please [open an issue](https://github.com/Pritam-nitj/ChatApp/issues/new) and provide as much detail as possible, including steps to reproduce it.
* **Suggesting Enhancements:** Have an idea for a new feature? [Open an issue](https://github.com/Pritam-nitj/ChatApp/issues/new) to describe your idea. This lets us discuss it before you put in a lot of work.
* **Pull Requests:** If you're ready to contribute code, follow the setup and pull request process below.

## Development Setup

To get the project running on your local machine for development, follow these steps.

### 1. Fork & Clone the Repository

First, you need to fork the `Pritam-nitj/ChatApp` repository and then clone your fork to your local machine.

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone [https://github.com/YOUR_USERNAME/ChatApp.git](https://github.com/YOUR_USERNAME/ChatApp.git)
cd ChatApp
```

### 2. Create a New Branch

It's important to create a new branch for your changes. This keeps your `main` branch clean and makes it easy to submit your work.

```bash
# Choose a descriptive branch name
git checkout -b my-new-feature
```

### 3. Install & Run (Manual Setup)

We recommend the manual setup for development, as it gives you more control and better error logging.

#### A. Setup the Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend/` directory. Copy the following and fill in your own credentials:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    PORT=5001
    JWT_SECRET=a_strong_secret_key_of_your_choice
    NODE_ENV=development
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    FRONTEND_URL=http://localhost:5173
    ```
4.  Start the backend development server:
    ```bash
    npm run dev
    ```

#### B. Setup the Frontend

1.  Open a **new terminal window** (leave the backend server running).
2.  Navigate to the frontend directory from the project root:
    ```bash
    cd frontend
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env` file in the `frontend/` directory with your Giphy API key (if you have one):
    ```env
    VITE_GIPHY_API=your_giphy_api_key
    ```
5.  Start the frontend development server:
    ```bash
    npm run dev
    ```

You should now be able to access the application at `http://localhost:5173`.

### 4. Make Your Changes

Now you can start working on the code. Make your changes, fix bugs, or add new features.

## Submitting Your Pull Request (PR)

Once your changes are complete:

1.  **Commit your work:**
    ```bash
    git add .
    git commit -m "feat: add my awesome new feature" 
    # (or "fix: resolve login bug", etc.)
    ```

2.  **Push to your fork:**
    ```bash
    # 'my-new-feature' is the branch you created
    git push origin my-new-feature
    ```

3.  **Open a Pull Request:**
    * Go to your forked repository on GitHub (`https://github.com/YOUR_USERNAME/ChatApp`).
    * You will see a "Compare & pull request" button. Click it.
    * This will open a new page to create a PR. Make sure the **base repository** is `Pritam-nitj/ChatApp` and the **head repository** is your fork.
    * Add a clear title and description to your PR, explaining what you did and why. If it fixes an existing issue, link it (e.g., `Closes #96`).

4.  **Wait for Review:**
    A maintainer will review your PR. They may request changes. Please be responsive and make any necessary updates.

Thank you for your contribution!
