const mysql = require('mysql');
const inquirer = require('inquirer');
const credentials = require('./config/config.json');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// General Menu

// const generalMenu = () => {
//     console.log(`Welcome to Ryan's Employee Database!`)
//     inquirer
//         .promopt({
//             name: 'selection',
//             type: 'rawlist',
//             message: 'What database category are you working with?',
//             choices: [
//                 'View Deparments',
//                 'View Roles',
//                 'View Employees',
//                 'Add Department',
//                 'Add Role',
//                 'Add Employee',
//                 'Delete Department',
//                 'Delete Role',
//                 'Delete Employee',
//                 'Change Employee Role',
//                 'Assign Manager',


//             ]})
// }

// Compare login credentials to stored config file.
const compareHash = (username, password) => {
    bcrypt.compare(username, credentials.username, function(err, result) {
        if (!result) {
            console.log("Bad username.");
            process.exit(0);
        }
        bcrypt.compare(password, credentials.password, function(err, result) {
            if (!result) {
                console.log("Bad password.");
                process.exit(0);
            }

            const connection = mysql.createConnection({
                host: 'localhost',
              
                // Your port; if not 3306
                port: 3306,
              
                // Your username
                user: username,
              
                // Your password
                password: password,
                database: 'employee-database',
              });

            connection.connect((err) => {
            if (err) throw err;
            console.log("connection to database successful.\n");
            });
        })
    })
}

// Login
const access = () => {
    inquirer
        .prompt([
            {
            type: 'input',
            name: 'username',
            message: 'What is your mySQL username?'
            },
            {
            type: 'password',
            name: 'password',
            message: 'What is your mySQL password?'
            }
        ]).then((answer) => {
                compareHash(answer.username, answer.password);
            });
}

access();