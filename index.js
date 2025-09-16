const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user for input
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(`${question}${defaultValue ? ` (default: ${defaultValue})` : ''}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Helper function to ask yes/no questions
function askYesNo(question, defaultValue = 'yes') {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n, default: ${defaultValue}): `, (answer) => {
      const normalized = answer.trim().toLowerCase();
      if (!normalized) {
        resolve(defaultValue === 'yes');
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

// Valid subtypes for datasource blocks (case-insensitive)
const VALID_SUBTYPES = [
  'restquery',
  'graphqlquery',
  'sqlquery',
  's3query',
  'firebasequery',
  'dynamoquery',
  'openapiqy'
];

// Function to check if a file should be modified
function shouldModifyFile(yamlData) {
  if (!yamlData || typeof yamlData !== 'object') return false;
  
  const type = yamlData.type;
  const subtype = yamlData.subtype;
  
  if (type !== 'datasource') return false;
  if (!subtype || typeof subtype !== 'string') return false;
  
  return VALID_SUBTYPES.includes(subtype.toLowerCase());
}

// Function to get all workflow directories
function getWorkflowDirectories(workflowsPath) {
  try {
    const items = fs.readdirSync(workflowsPath);
    return items.filter(item => {
      const itemPath = path.join(workflowsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });
  } catch (error) {
    console.error(`Error reading workflows directory: ${error.message}`);
    return [];
  }
}

// Function to get block files (excluding workflow.yml and startTrigger.yml)
function getBlockFiles(workflowDir) {
  try {
    const files = fs.readdirSync(workflowDir);
    return files.filter(file => {
      return file.endsWith('.yml') && 
             file !== 'workflow.yml' && 
             file !== 'startTrigger.yml';
    });
  } catch (error) {
    console.error(`Error reading workflow directory ${workflowDir}: ${error.message}`);
    return [];
  }
}

// Function to read and parse YAML file
function readYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error(`Error reading YAML file ${filePath}: ${error.message}`);
    return null;
  }
}

// Function to write YAML file
function writeYamlFile(filePath, data) {
  try {
    const yamlContent = yaml.dump(data, { 
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    fs.writeFileSync(filePath, yamlContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing YAML file ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to add or update retry policy
function addRetryPolicy(yamlData, retryConfig) {
  // Ensure blockData exists
  if (!yamlData.blockData) {
    yamlData.blockData = {};
  }
  
  // Add or update retryPolicy
  yamlData.blockData.retryPolicy = {
    numAttempts: retryConfig.numAttempts,
    initialIntervalMs: retryConfig.initialIntervalMs,
    maximumIntervalMs: retryConfig.maximumIntervalMs,
    backoffCoefficient: 2
  };
  
  return yamlData;
}

// Main function
async function main() {
  console.log('YAML Retry Policy Modifier Script');
  console.log('==================================\n');
  
  const workflowsPath = './workflows';
  
  // Check if workflows directory exists
  if (!fs.existsSync(workflowsPath)) {
    console.error('Error: workflows directory not found!');
    rl.close();
    return;
  }
  
  // Get retry policy configuration from user
  console.log('Please configure the retry policy:');
  
  let numAttempts;
  do {
    const input = await askQuestion('Number of attempts', '6');
    numAttempts = parseInt(input);
    if (isNaN(numAttempts) || numAttempts < 1) {
      console.log('Error: numAttempts must be a number >= 1');
    }
  } while (isNaN(numAttempts) || numAttempts < 1);
  
  const initialIntervalMs = parseInt(await askQuestion('Initial interval (ms)', '1000'));
  const maximumIntervalMs = parseInt(await askQuestion('Maximum interval (ms)', '20000'));
  
  const retryConfig = {
    numAttempts,
    initialIntervalMs: isNaN(initialIntervalMs) ? 1000 : initialIntervalMs,
    maximumIntervalMs: isNaN(maximumIntervalMs) ? 20000 : maximumIntervalMs
  };
  
  console.log('\nRetry policy configuration:');
  console.log(`  numAttempts: ${retryConfig.numAttempts}`);
  console.log(`  initialIntervalMs: ${retryConfig.initialIntervalMs}`);
  console.log(`  maximumIntervalMs: ${retryConfig.maximumIntervalMs}`);
  console.log('  backoffCoefficient: 2\n');
  
  // Get workflow directories
  const workflowDirs = getWorkflowDirectories(workflowsPath);
  
  if (workflowDirs.length === 0) {
    console.log('No workflow directories found.');
    rl.close();
    return;
  }
  
  console.log(`Found ${workflowDirs.length} workflow(s):\n`);
  
  let totalModified = 0;
  
  // Process each workflow directory
  for (const workflowName of workflowDirs) {
    const workflowPath = path.join(workflowsPath, workflowName);
    
    // Ask user if they want to modify this workflow
    const shouldModify = await askYesNo(`Modify workflow "${workflowName}"?`);
    
    if (!shouldModify) {
      console.log(`  Skipping workflow "${workflowName}"\n`);
      continue;
    }
    
    console.log(`Processing workflow: ${workflowName}`);
    
    // Get block files
    const blockFiles = getBlockFiles(workflowPath);
    
    if (blockFiles.length === 0) {
      console.log('  No block files found.\n');
      continue;
    }
    
    let modifiedInWorkflow = 0;
    
    // Process each block file
    for (const blockFile of blockFiles) {
      const blockPath = path.join(workflowPath, blockFile);
      console.log(`  Checking ${blockFile}...`);
      
      // Read and parse YAML
      const yamlData = readYamlFile(blockPath);
      if (!yamlData) {
        console.log(`    Error: Could not read ${blockFile}`);
        continue;
      }
      
      // Check if file should be modified
      if (!shouldModifyFile(yamlData)) {
        console.log(`    Skipping: Not a datasource block with valid subtype`);
        continue;
      }
      
      // Add retry policy
      const modifiedData = addRetryPolicy(yamlData, retryConfig);
      
      // Write back to file
      if (writeYamlFile(blockPath, modifiedData)) {
        console.log(`    ✓ Modified ${blockFile}`);
        modifiedInWorkflow++;
        totalModified++;
      } else {
        console.log(`    Error: Could not write ${blockFile}`);
      }
    }
    
    console.log(`  Modified ${modifiedInWorkflow} file(s) in this workflow\n`);
  }
  
  console.log(`\nCompleted! Modified ${totalModified} block file(s) total.`);
  rl.close();
}

// Handle errors and cleanup
process.on('SIGINT', () => {
  console.log('\nScript interrupted by user.');
  rl.close();
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('An unexpected error occurred:', error);
  rl.close();
  process.exit(1);
});