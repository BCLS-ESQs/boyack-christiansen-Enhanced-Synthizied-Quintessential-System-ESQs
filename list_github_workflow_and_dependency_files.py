import os
import sys
import subprocess

REPO_URL = sys.argv[1] if len(sys.argv) > 1 else None
if not REPO_URL:
    print("Usage: python list_github_workflow_and_dependency_files.py <repo_url>")
    sys.exit(1)

REPO_NAME = REPO_URL.rstrip("/").split("/")[-1].replace(".git", "")
DEPENDENCY_FILES = [
    "package.json", "requirements.txt", "Pipfile",
    "yarn.lock", "poetry.lock", "Gemfile", "composer.json",
    "Cargo.toml", "go.mod", "environment.yml", "env.yml", "setup.py"
]
WORKFLOW_DIR = ".github/workflows"

# Clone or update the repository
if not os.path.exists(REPO_NAME):
    print(f"Cloning repository {REPO_URL} ...")
    result = subprocess.run(["git", "clone", "--depth", "1", REPO_URL])
    if result.returncode != 0:
        print("Failed to clone repository.")
        sys.exit(2)
else:
    print(f"Repository {REPO_NAME} already exists. Pulling latest changes ...")
    result = subprocess.run(["git", "-C", REPO_NAME, "pull"])
    if result.returncode != 0:
        print("Failed to pull latest changes.")
        sys.exit(3)

# Walk through the file tree
workflow_files = []
dependency_files = []
for root, dirs, files in os.walk(REPO_NAME):
    for file in files:
        rel_path = os.path.relpath(os.path.join(root, file), REPO_NAME)
        if rel_path.startswith(WORKFLOW_DIR) and file.endswith(('.yml', '.yaml')):
            workflow_files.append(rel_path)
        if file in DEPENDENCY_FILES:
            dependency_files.append(rel_path)

print("\nWorkflow files found:")
if workflow_files:
    for wf in workflow_files:
        print(f"  - {wf}")
else:
    print("  (none found)")

print("\nDependency files found:")
if dependency_files:
    for df in dependency_files:
        print(f"  - {df}")
else:
    print("  (none found)")
