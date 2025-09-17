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

### Step 1: Create a Branch

**Before running this script, always create a new branch from main.** This script modifies YAML files in place, so it's important to work in a separate branch.

```bash
# Create a new branch before making changes
git checkout -b add-retry-policies
```

### Step 2: Run the Script

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

### Step 3: Push Changes and Create Pull Request

After the script completes successfully:

```bash
# Add and commit your changes
git add .
git commit -m "Add retry policies to workflow blocks"

# Push your branch
git push -u origin add-retry-policies

# Open a pull request to main through your Git platform (GitHub, GitLab, etc.)
```

### Step 4: Merge and Deploy

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
│   │   ├── thirdblock.yml
│   │   └── functions/
│   │       ├── My Function 1/
│   │       │   ├── function.yml
│   │       │   ├── params.yml
│   │       │   ├── functionBlock1.yml
│   │       │   └── functionBlock2.yml
│   │       └── My Function 2/
│   │           ├── function.yml
│   │           ├── params.yml
│   │           └── functionBlock3.yml
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
The script only modifies resource query blocks: REST APIs, GraphQL, SQL databases, AWS S3, Firebase, DynamoDB, and OpenAPI endpoints. It processes blocks in both workflows and their functions, but skips metadata files and function calls.

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
Workflow Retry Policy Modifier Script
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
  Processing function: My Function 1
    Checking functionBlock1.yml...
      ✓ Modified functionBlock1.yml
    Checking functionBlock2.yml...
      Skipping: Not a datasource block with valid subtype
  Modified 2 file(s) in this workflow

Completed! Modified 2 block file(s) total.
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
