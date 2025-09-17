# Workflow Retry Policy Modifier

A Node.js script that automatically adds or updates retry policies in Retool workflow YAML files. This tool is designed to work with workflow directory structures containing datasource blocks that need consistent retry behavior.

## Installation

### Prerequisites
- Node.js (version 12 or higher)
- npm

### Setup

1. Clone this repository or download the script files
2. Navigate to the script directory
3. Install dependencies:

```bash
npm install
```

## Usage

### Step 1: Clone Your Retool git Repository (If You Haven't Already)

If you do not have a local copy of the git repository, you should clone the repo first:

```bash
git clone https://path/to/your/repo
```

### Step 2: Create a Branch

**Before running this script, always create a new branch from main.** This script modifies YAML files in place, so it's important to work in a separate branch.

```bash
# In the Retool git directory, create a new branch before making changes
git checkout -b add-retry-policies
```

### Step 3: Run the Script

#### Basic Usage (Current Directory)

If your workflows directory is in the current directory:

```bash
node retry-modifier.js
```

#### Specify Custom Directory

If your workflows are in a different location:

```bash
node retry-modifier.js /path/to/your/project
node retry-modifier.js ../other-project
```

### Step 4: Push Changes and Create Pull Request

After the script completes successfully:

```bash
# From the Retool git directory, add and commit your changes
git add .
git commit -m "Add retry policies to workflow blocks"

# Push your branch
git push -u origin add-retry-policies

# Open a pull request to main through your Git platform (GitHub, GitLab, etc.)
```

### Step 5: Merge and Deploy

Once your pull request is reviewed and approved:

1. Merge the pull request into main
2. The changes will automatically propagate to Retool and update your workflows with the new retry policies

## Directory Structure

The script expects a directory structure like this:

```
your-project/
├── workflows/
│   ├── My First Workflow/
│   │   ├── workflow.yml
│   │   ├── startTrigger.yml
│   │   ├── firstblock.yml
│   │   ├── secondblock.yml
│   │   └── thirdblock.yml
│   └── Another Workflow/
│       ├── workflow.yml
│       ├── startTrigger.yml
│       ├── codeblock.yml
│       └── queryblock.yml
```

## How It Works

### 1. Configuration
The script will prompt you to configure the retry policy:

```
Number of retries (default: 5): 3
Initial interval (ms) (default: 1000): 2000
Maximum interval (ms) (default: 20000): 300000
Backoff coefficient (default: 2): 1.5
```

**Note:** The script asks for "number of retries" but stores "number of attempts" (retries + 1) in the YAML files.

### 2. Workflow Selection
For each workflow that needs updates, the script will ask:

```
Modify workflow "My First Workflow"? (y/n, default: yes):
```

The script automatically skips workflows where all eligible blocks already have the correct retry policy, saving you time on subsequent runs.

### 3. Smart Filtering
The script only modifies resource query blocks: REST APIs, GraphQL, SQL databases, AWS S3, Firebase, DynamoDB, and OpenAPI endpoints.

## Output Format

The script adds or updates a `retryPolicy` block under the `blockData` section:

```yaml
blockData:
  retryPolicy:
    numAttempts: 4
    initialIntervalMs: 2000
    maximumIntervalMs: 300000
    backoffCoefficient: 1.5
  # Other existing blockData properties are preserved
```

## Example Session

```
YAML Retry Policy Modifier Script
==================================

Base directory: /home/user/my-project
Looking for workflows in: /home/user/my-project/workflows

Please configure the retry policy:
Number of retries (default: 5): 3
Initial interval (ms) (default: 1000): 
Maximum interval (ms) (default: 20000): 
Backoff coefficient (default: 2): 

Retry policy configuration:
  numAttempts: 4 (3 retries + 1 initial attempt)
  initialIntervalMs: 1000
  maximumIntervalMs: 20000
  backoffCoefficient: 2

Found 2 workflow(s):

Skipping workflow "My First Workflow": All eligible blocks already have correct retry policy

Modify workflow "Another Workflow"? (y/n, default: yes): y
Processing workflow: Another Workflow
  Checking codeblock.yml...
    Skipping: Not a datasource block with valid subtype
  Checking queryblock.yml...
    ✓ Modified queryblock.yml
  Modified 1 file(s) in this workflow

Completed! Modified 1 block file(s) total.
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is MIT licensed.
