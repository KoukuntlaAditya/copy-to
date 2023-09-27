import * as fs from 'fs-extra';
import * as path from 'path';
import * as commander from 'commander';
import os from 'os';

// Define paths and constants
const TEMP_DIR = path.join(os.homedir(), '_dir_switch_temp');
const LAST_DESTINATION_FILE = path.join(os.homedir(), 'last-destination.txt');

// Function to store the last destination path in a file
export const storeLastDestinationPath = async (destinationPath: string): Promise<void> => {
  try {
    await fs.writeFile(LAST_DESTINATION_FILE, destinationPath, 'utf-8');
    console.log(`Last destination path saved: ${destinationPath}`);
  } catch (error) {
    console.error(`Error saving last destination path: ${error}`);
  }
};

// Function to replace a directory
export const replaceDirectory = async (srcPath: string, destPath: string): Promise<void> => {
  try {
    await fs.copy(destPath, TEMP_DIR, { overwrite: true });
    await fs.copy(srcPath, destPath, { overwrite: true });
    await storeLastDestinationPath(destPath);
    console.log(`Directory '${srcPath}' replaced with '${destPath}'.`);
    console.log(`A backup of the original directory is stored in '${TEMP_DIR}'.`);
    console.log(`Use --undo or -u to restore.`);
  } catch (error) {
    console.error(`Error replacing directory: ${error}`);
  }
};

// Function to undo the directory replacement
export const undoReplace = async (): Promise<void> => {
  try {
    const lastDestinationPath = await fs.readFile(LAST_DESTINATION_FILE, 'utf-8');
    if (lastDestinationPath) {
      console.log(`Last destination path: ${lastDestinationPath}`);
      await fs.copy(TEMP_DIR, lastDestinationPath, { overwrite: true });
      console.log(`Original directory restored.`);
      fs.remove(TEMP_DIR);
      fs.remove(LAST_DESTINATION_FILE);
      console.log(`Removed Temp folders`);
    } else {
      console.log('No last destination path found.');
    }
  } catch (error) {
    console.error(`Error undoing directory replacement: ${error}`);
  }
};

// Create a new Commander program
const program = new commander.Command();

// Define the command-line options
program
  .option('-d, --dest <path>', 'Destination directory path')
  .option('-u, --undo', 'Undo the directory replacement');

// Parse the command-line arguments
program.parse(process.argv);

// Get the value of the 'dest' option from the command line
const destPath = program.opts().dest;
const isUndo = program.opts().undo;

if (isUndo) {
  // User wants to undo the directory replacement
  undoReplace();
} else if (destPath) {
  // User wants to perform the directory replacement
  const srcPath = process.cwd();
  replaceDirectory(srcPath, destPath);
} else {
  console.error('Usage: node your-module-name.js -d <destPath> OR node your-module-name.js -u');
}
