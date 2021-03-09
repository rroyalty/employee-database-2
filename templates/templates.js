const templates = {
    View: {
        Employee: `SELECT E.first_name as First, E.last_name as Last, D.Department, R.Role, R.Salary, E.isManager FROM employee as E LEFT JOIN role as R ON E.id_role = R.id LEFT JOIN department as D ON R.id_department = D.id`,
        Department: 'SELECT Department FROM department',
        Role: 'SELECT R.Role, R.Salary, D.Department FROM role as R LEFT JOIN department as D ON R.id_department = D.id'
    },
    QuestionList: {
        Employee: [                    
                    {
                        type: 'list',
                        name: 'id_role',
                        message: 'What role is your employee going to fill?',
                        pageSize: 8,
                        choices: "" 
                    },
                    {
                        type: 'input',
                        name: 'first_name',
                        message: 'What is the first name of your employee?'
                    },
                    {
                        type: 'input',
                        name: 'last_name',
                        message: 'What is the last name of your employee?'
                    }
                ],
        Role:   [                    
                    {
                        type: 'list',
                        name: 'id_department',
                        message: 'What department is the role you are creating in?',
                        pageSize: 8,
                        choices: "" 
                    },
                    {
                        type: 'input',
                        name: 'Role',
                        message: 'What is the role title?'
                    },
                    {
                        type: 'input',
                        name: 'Salary',
                        message: 'What is the role salary?',
                        validate: (Salary) => {
                            if (isNaN(Salary)) return `Please input a number.`;
                            else return true;
                        }
                    },
                ],
        Department:   [                    
                    {
                        type: 'input',
                        name: 'Department',
                        message: 'What is the new department called?'
                    }
                ],
        },
}


module.exports = templates;