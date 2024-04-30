const { exec } = require('child_process');

// Define the command to execute
const command = 'ngrok http http://localhost:7000';

// Execute the command
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error}`);
        return;
    }

    // Log the stdout and stderr
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
