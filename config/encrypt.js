const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
let credentials = {};

const generateHash = (username, password) => {

    bcrypt.hash(username, 10, function(err, hash) {
        credentials.username = hash;
        bcrypt.hash(password, 10, function(err, hash) {
            credentials.password = hash;

            fs.writeFileSync('config.json', JSON.stringify(credentials), function (err) {
                if (err) throw err;
                console.log('Config File Saved!');
                process.exit(1);
            })
        });
    });
}

const inputCredentials = () => {
    inquirer
        .prompt([
            {
            type: 'input',
            name: 'username',
            message: 'What is your mySQL username?'
            },
            {
            type: 'password',
            name: 'password1',
            message: 'What is your mySQL password?'
            },
            {
            type: 'password',
            name: 'password2',
            message: 'Again, what is your mySQL password?'
            }
        ]).then((answer) => {
                if(answer.password1 !== answer.password2) {
                    console.log(`Passwords do not match. Please try again.\n`)
                    inputCredentials();
                }
                generateHash(answer.username, answer.password1);
            });
}

inputCredentials();

