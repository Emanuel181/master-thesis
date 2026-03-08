"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isDemoPath, clearDemoStorage, DEMO_STORAGE_PREFIX } from '@/lib/demo-mode';

const DemoContext = createContext();

// =============================================
// DEMO GITHUB REPOSITORIES
// =============================================
const DEMO_GITHUB_REPOS = [
    {
        id: 1001,
        name: "vulnerable-express-app",
        full_name: "demo-org/vulnerable-express-app",
        description: "Express.js application with intentional security vulnerabilities for testing",
        private: false,
        language: "JavaScript",
        stargazers_count: 245,
        updated_at: "2024-12-15T10:30:00Z",
        default_branch: "main",
        provider: "github",
    },
    {
        id: 1002,
        name: "insecure-flask-api",
        full_name: "demo-org/insecure-flask-api",
        description: "Python Flask REST API with common security flaws for educational purposes",
        private: false,
        language: "Python",
        stargazers_count: 189,
        updated_at: "2024-12-10T14:22:00Z",
        default_branch: "main",
        provider: "github",
    },
    {
        id: 1003,
        name: "legacy-java-webapp",
        full_name: "demo-org/legacy-java-webapp",
        description: "Legacy Java Spring application with outdated dependencies and security issues",
        private: true,
        language: "Java",
        stargazers_count: 67,
        updated_at: "2024-12-08T09:15:00Z",
        default_branch: "master",
        provider: "github",
    },
    {
        id: 1004,
        name: "react-auth-example",
        full_name: "demo-org/react-auth-example",
        description: "React frontend with authentication vulnerabilities for security training",
        private: false,
        language: "TypeScript",
        stargazers_count: 412,
        updated_at: "2024-12-20T16:45:00Z",
        default_branch: "main",
        provider: "github",
    },
    {
        id: 1005,
        name: "dotnet-ecommerce",
        full_name: "demo-org/dotnet-ecommerce",
        description: ".NET e-commerce platform with payment processing vulnerabilities",
        private: true,
        language: "C#",
        stargazers_count: 156,
        updated_at: "2024-12-18T11:30:00Z",
        default_branch: "develop",
        provider: "github",
    },
    {
        id: 1006,
        name: "node-microservices",
        full_name: "demo-org/node-microservices",
        description: "Microservices architecture with API gateway security vulnerabilities",
        private: false,
        language: "JavaScript",
        stargazers_count: 328,
        updated_at: "2024-12-22T08:15:00Z",
        default_branch: "main",
        provider: "github",
    },
];

// =============================================
// DEMO GITLAB REPOSITORIES
// =============================================
const DEMO_GITLAB_REPOS = [
    {
        id: 2001,
        name: "php-cms-demo",
        full_name: "demo-group/php-cms-demo",
        description: "PHP content management system with SQL injection and XSS vulnerabilities",
        private: false,
        language: "PHP",
        star_count: 98,
        last_activity_at: "2024-12-12T08:20:00Z",
        default_branch: "main",
        provider: "gitlab",
    },
    {
        id: 2002,
        name: "go-microservices",
        full_name: "demo-group/go-microservices",
        description: "Go microservices with API security issues and improper authentication",
        private: true,
        language: "Go",
        star_count: 234,
        last_activity_at: "2024-12-19T15:10:00Z",
        default_branch: "main",
        provider: "gitlab",
    },
    {
        id: 2003,
        name: "ruby-rails-blog",
        full_name: "demo-group/ruby-rails-blog",
        description: "Ruby on Rails blog application with mass assignment vulnerabilities",
        private: false,
        language: "Ruby",
        star_count: 145,
        last_activity_at: "2024-12-14T12:00:00Z",
        default_branch: "main",
        provider: "gitlab",
    },
    {
        id: 2004,
        name: "django-elearning",
        full_name: "demo-group/django-elearning",
        description: "Django e-learning platform with IDOR and authentication flaws",
        private: false,
        language: "Python",
        star_count: 187,
        last_activity_at: "2024-12-21T09:30:00Z",
        default_branch: "main",
        provider: "gitlab",
    },
];

// =============================================
// DEMO PROJECT STRUCTURES (Multiple Projects)
// =============================================

// Project 1: Vulnerable Express App (JavaScript)
const DEMO_PROJECT_EXPRESS = {
    name: "vulnerable-express-app",
    type: "directory",
    children: [
        {
            name: "src",
            type: "directory",
            children: [
                {
                    name: "index.js",
                    type: "file",
                    content: `const express = require('express');
const mysql = require('mysql');
const app = express();

// Vulnerable: No input sanitization
app.get('/users', (req, res) => {
    const userId = req.query.id;
    
    // SQL Injection vulnerability - user input directly in query
    const query = "SELECT * FROM users WHERE id = " + userId;
    
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err.message);
        }
        res.json(results);
    });
});

// Vulnerable: XSS - No output encoding
app.get('/profile', (req, res) => {
    const username = req.query.name;
    
    // XSS vulnerability - unescaped user input in HTML
    res.send(\`
        <html>
            <body>
                <h1>Welcome, \${username}!</h1>
                <p>Your profile page</p>
            </body>
        </html>
    \`);
});

// Vulnerable: Path Traversal
app.get('/files', (req, res) => {
    const filename = req.query.file;
    
    // Path traversal vulnerability - no validation
    const filepath = './uploads/' + filename;
    res.sendFile(filepath);
});

// Vulnerable: Hardcoded credentials
const dbConfig = {
    host: 'localhost',
    user: 'admin',
    password: 'password123', // Hardcoded secret
    database: 'myapp'
};

const connection = mysql.createConnection(dbConfig);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});`,
                },
                {
                    name: "routes",
                    type: "directory",
                    children: [
                        {
                            name: "users.js",
                            type: "file",
                            content: `// User routes with SQL injection vulnerability
const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
    const query = "SELECT * FROM users WHERE id = " + req.params.id;
    db.query(query, (err, result) => {
        res.json(result);
    });
});

router.post('/search', (req, res) => {
    const { name } = req.body;
    const query = \`SELECT * FROM users WHERE name LIKE '%\${name}%'\`;
    db.query(query, (err, result) => {
        res.json(result);
    });
});

module.exports = router;`,
                        },
                        {
                            name: "auth.js",
                            type: "file",
                            content: `// Authentication routes with security issues
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // VULNERABLE: Using MD5 - cryptographically weak
    const hash = crypto.createHash('md5').update(password).digest('hex');
    
    const user = users.find(u => u.username === username);
    if (user && user.passwordHash === hash) {
        req.session.userId = user.id;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

module.exports = router;`,
                        },
                        {
                            name: "admin.js",
                            type: "file",
                            content: `// Admin routes with authorization issues
const express = require('express');
const router = express.Router();

// VULNERABLE: Missing authorization check
router.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
        res.json(result);
    });
});

// VULNERABLE: IDOR
router.delete('/user/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
        res.json({ deleted: true });
    });
});

module.exports = router;`,
                        },
                    ],
                },
                {
                    name: "utils",
                    type: "directory",
                    children: [
                        {
                            name: "database.js",
                            type: "file",
                            content: `const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: 'admin123', // SECURITY ISSUE: Hardcoded password
    database: 'production_db'
});

module.exports = connection;`,
                        },
                        {
                            name: "crypto.js",
                            type: "file",
                            content: `const crypto = require('crypto');

// VULNERABLE: Weak encryption
const ALGORITHM = 'des-ecb';
const KEY = 'mysecret';

function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, null);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

function generateToken() {
    return Math.random().toString(36).substring(2);
}

module.exports = { encrypt, generateToken };`,
                        },
                    ],
                },
                {
                    name: "middleware",
                    type: "directory",
                    children: [
                        {
                            name: "auth.js",
                            type: "file",
                            content: `const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-123';

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { verifyToken };`,
                        },
                    ],
                },
            ],
        },
        {
            name: "config",
            type: "directory",
            children: [
                {
                    name: "secrets.js",
                    type: "file",
                    content: `// VULNERABLE: Secrets in source code
module.exports = {
    AWS_ACCESS_KEY: 'AKIA_EXAMPLE_KEY_HERE',
    AWS_SECRET_KEY: 'example_secret_key_replace_me_in_production',
    JWT_SECRET: 'super-secret-jwt-key-do-not-share'
};`,
                },
            ],
        },
        {
            name: "package.json",
            type: "file",
            content: `{
  "name": "vulnerable-express-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "mysql": "^2.18.1",
    "jsonwebtoken": "^8.5.1"
  }
}`,
        },
        {
            name: "README.md",
            type: "file",
            content: `# Vulnerable Express App

Demo application with security vulnerabilities for VulnIQ.

## Vulnerabilities
1. SQL Injection
2. XSS
3. Path Traversal
4. Hardcoded Credentials
5. Weak Cryptography
`,
        },
        {
            name: "unformatted.js",
            type: "file",
            content: `// This file has bad formatting - try the Format button!
const express=require('express');const app=express();const users=[{id:1,name:'John',email:'john@example.com'},{id:2,name:'Jane',email:'jane@example.com'},{id:3,name:'Bob',email:'bob@example.com'}];
app.get('/api/users',(req,res)=>{const{search,limit,offset}=req.query;let result=users;if(search){result=result.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));}if(limit){result=result.slice(offset||0,parseInt(limit)+(offset||0));}res.json({data:result,total:users.length,filtered:result.length});});
app.post('/api/users',(req,res)=>{const{name,email}=req.body;if(!name||!email){return res.status(400).json({error:'Name and email required'});}const newUser={id:users.length+1,name,email};users.push(newUser);res.status(201).json(newUser);});
app.put('/api/users/:id',(req,res)=>{const id=parseInt(req.params.id);const user=users.find(u=>u.id===id);if(!user){return res.status(404).json({error:'User not found'});}const{name,email}=req.body;if(name)user.name=name;if(email)user.email=email;res.json(user);});
app.delete('/api/users/:id',(req,res)=>{const id=parseInt(req.params.id);const index=users.findIndex(u=>u.id===id);if(index===-1){return res.status(404).json({error:'User not found'});}users.splice(index,1);res.status(204).send();});
app.listen(3000,()=>console.log('Server running'));`,
        },
    ],
};

// Project 2: Insecure Flask API (Python)
const DEMO_PROJECT_FLASK = {
    name: "insecure-flask-api",
    type: "directory",
    children: [
        {
            name: "app",
            type: "directory",
            children: [
                {
                    name: "__init__.py",
                    type: "file",
                    content: `from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'dev'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///production.db'

db = SQLAlchemy(app)

from app import routes, models`,
                },
                {
                    name: "routes.py",
                    type: "file",
                    content: `from flask import Flask, request, jsonify, render_template_string
from app import app, db
import pickle
import subprocess

@app.route('/api/users/search')
def search_users():
    query = request.args.get('q', '')
    # SQL Injection
    result = db.engine.execute(f"SELECT * FROM users WHERE name LIKE '%{query}%'")
    return jsonify([dict(row) for row in result])

@app.route('/api/ping')
def ping():
    host = request.args.get('host', 'localhost')
    # Command Injection
    output = subprocess.check_output(f'ping -c 1 {host}', shell=True)
    return output

@app.route('/api/session', methods=['POST'])
def load_session():
    data = request.get_data()
    # Insecure Deserialization
    session_data = pickle.loads(data)
    return jsonify(session_data)

@app.route('/api/greeting')
def greeting():
    name = request.args.get('name', 'World')
    # SSTI
    template = f'<h1>Hello {name}!</h1>'
    return render_template_string(template)`,
                },
                {
                    name: "models.py",
                    type: "file",
                    content: `from app import db
from werkzeug.security import generate_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    
    def set_password(self, password):
        # VULNERABLE: Weak hash
        self.password_hash = generate_password_hash(password, method='md5')
    
    def to_dict(self):
        # VULNERABLE: Exposes password_hash
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash
        }`,
                },
                {
                    name: "auth.py",
                    type: "file",
                    content: `from flask import request, jsonify
from functools import wraps
import jwt

SECRET_KEY = 'flask-secret-key'

def create_token(user_id):
    return jwt.encode({'user_id': user_id}, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256', 'none'])
            return f(data['user_id'], *args, **kwargs)
        except:
            return jsonify({'error': 'Invalid token'}), 401
    return decorated`,
                },
            ],
        },
        {
            name: "config.py",
            type: "file",
            content: `class Config:
    SECRET_KEY = 'super-secret-flask-key'
    SQLALCHEMY_DATABASE_URI = 'postgresql://admin:password123@localhost/production'
    DEBUG = True
    WTF_CSRF_ENABLED = False
    AWS_ACCESS_KEY_ID = 'your-aws-access-key-here'
    AWS_SECRET_ACCESS_KEY = 'your-aws-secret-key-here'`,
        },
        {
            name: "requirements.txt",
            type: "file",
            content: `Flask==1.1.2
Flask-SQLAlchemy==2.5.1
PyJWT==1.7.1
Werkzeug==1.0.1
requests==2.25.0`,
        },
        {
            name: "run.py",
            type: "file",
            content: `from app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)`,
        },
        {
            name: "unformatted.py",
            type: "file",
            content: `#    This file has bad formatting - try the Format button!
import    os
import sys
import      json
from typing import Dict,List,Optional,Any,Union,Callable


class    UserManager:
        """Manages users in the system."""
        def __init__(    self,db_path:str,cache_enabled   :bool=True,max_cache_size:   int=1000   ):
                        self.db_path=db_path
                        self.cache_enabled    =cache_enabled
                        self.max_cache_size=    max_cache_size
                        self.cache={       }
                        self.stats={   'hits':0,    'misses':0}



        def get_user(  self,   user_id:int  )   ->Optional[   Dict[str,Any]]:
                        if self.cache_enabled    and     user_id in self.cache:
                                    self.stats[   'hits']+=1
                                    return    self.cache[user_id]
                        self.stats['misses'   ]+=1
                        user   =self._fetch_from_db(   user_id)
                        if user    and self.cache_enabled:
                                    self.cache[user_id]   =user
                        return    user


        def _fetch_from_db(self,user_id   :int)->   Optional[Dict[str   ,Any]]:
                        data={   'id':user_id,'name':f'User{user_id}',
                        'email'   :f'user{user_id}@example.com',
                                    'active':True,'role':'user',
                        'created_at':'2024-01-01'   }
                        return    data
        def create_user(   self,  name:str,email   :str,  role   :str='user'   )->Dict[str,Any]:
                        user_id=len(   self.cache)+1
                        user={    'id':user_id,   'name':name,'email':   email,
'role':role,'active'   :True}
                        self.cache[   user_id]=user
                        return   user



        def update_user( self,user_id:int,    **kwargs   )->Optional[Dict[   str,Any]]:
                        user=self.get_user(   user_id   )
                        if    not user:
                                    return    None
                        for   key,  value   in kwargs.items():
                                    if key    in user:
                                                user[   key]=value
                        return   user
        def delete_user(self   ,user_id:int   )->   bool:
                        if user_id   in self.cache:
                                    del    self.cache[user_id]
                                    return   True
                        return   False
        def list_users(self,active_only   :bool=False)->List[   Dict[str,   Any]]:
                        users   =list(self.cache.values(   ))
                        if    active_only:
                                    return[u    for u   in users   if u.get(   'active',True)]
                        return   users


if __name__   =='__main__':
        manager   =UserManager(   '/tmp/users.db')
        manager.create_user('Alice'   ,'alice@example.com')
        manager.create_user(    'Bob','bob@example.com',   'admin')
        users=   manager.list_users()
        print(   json.dumps(   users,indent=2))`,
        },
    ],
};

// Project 3: React Auth Example (TypeScript)
const DEMO_PROJECT_REACT = {
    name: "react-auth-example",
    type: "directory",
    children: [
        {
            name: "src",
            type: "directory",
            children: [
                {
                    name: "App.tsx",
                    type: "file",
                    content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* VULNERABLE: No auth check */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;`,
                },
                {
                    name: "components",
                    type: "directory",
                    children: [
                        {
                            name: "Login.tsx",
                            type: "file",
                            content: `import React, { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    
    // VULNERABLE: Token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/dashboard';
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}`,
                        },
                        {
                            name: "Dashboard.tsx",
                            type: "file",
                            content: `import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetchMessages();
  }, []);
  
  // VULNERABLE: XSS via dangerouslySetInnerHTML
  const renderMessage = (msg: string) => {
    return <div dangerouslySetInnerHTML={{ __html: msg }} />;
  };
  
  return (
    <div>
      {messages.map((msg, i) => renderMessage(msg))}
    </div>
  );
}`,
                        },
                        {
                            name: "UserProfile.tsx",
                            type: "file",
                            content: `import React, { useState, useEffect } from 'react';

export default function UserProfile() {
  const [url, setUrl] = useState('');
  
  // VULNERABLE: Open Redirect
  const handleRedirect = () => {
    window.location.href = url;
  };
  
  // VULNERABLE: postMessage without origin check
  useEffect(() => {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type === 'UPDATE_PROFILE') {
        updateProfile(data.profile);
      }
    });
  }, []);
  
  return (
    <div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} />
      <button onClick={handleRedirect}>Go</button>
    </div>
  );
}`,
                        },
                    ],
                },
                {
                    name: "api",
                    type: "directory",
                    children: [
                        {
                            name: "config.ts",
                            type: "file",
                            content: `// VULNERABLE: API keys in frontend
export const API_CONFIG = {
  apiKey: 'your-api-key-here',
  googleMapsKey: 'your-google-maps-key-here',
  stripeSecretKey: 'your-stripe-key-here',
  firebaseConfig: {
    apiKey: "your-firebase-key-here",
    authDomain: "myapp.firebaseapp.com"
  }
};`,
                        },
                    ],
                },
            ],
        },
        {
            name: "package.json",
            type: "file",
            content: `{
  "name": "react-auth-example",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  }
}`,
        },
        {
            name: "unformatted.tsx",
            type: "file",
            content: `// This file has bad formatting - try the Format button!
import React,{useState,useEffect,useCallback,useMemo}from'react';interface User{id:number;name:string;email:string;role:'admin'|'user'|'guest';active:boolean;createdAt:Date}interface UserListProps{users:User[];onSelect:(user:User)=>void;onDelete:(id:number)=>void;showInactive?:boolean}
const UserList:React.FC<UserListProps>=({users,onSelect,onDelete,showInactive=false})=>{const[filter,setFilter]=useState('');const[sortBy,setSortBy]=useState<keyof User>('name');const[sortDir,setSortDir]=useState<'asc'|'desc'>('asc')
const filteredUsers=useMemo(()=>{let result=users.filter(u=>showInactive||u.active);if(filter){result=result.filter(u=>u.name.toLowerCase().includes(filter.toLowerCase())||u.email.toLowerCase().includes(filter.toLowerCase()))}return result.sort((a,b)=>{const aVal=a[sortBy];const bVal=b[sortBy];if(aVal<bVal)return sortDir==='asc'?-1:1;if(aVal>bVal)return sortDir==='asc'?1:-1;return 0})},[users,filter,sortBy,sortDir,showInactive])
const handleSort=useCallback((field:keyof User)=>{if(sortBy===field){setSortDir(d=>d==='asc'?'desc':'asc')}else{setSortBy(field);setSortDir('asc')}},[sortBy])
return(<div className="user-list"><input type="text"placeholder="Search users..."value={filter}onChange={e=>setFilter(e.target.value)}className="search-input"/><table><thead><tr><th onClick={()=>handleSort('name')}>Name{sortBy==='name'&&(sortDir==='asc'?'↑':'↓')}</th><th onClick={()=>handleSort('email')}>Email</th><th onClick={()=>handleSort('role')}>Role</th><th>Actions</th></tr></thead><tbody>{filteredUsers.map(user=>(<tr key={user.id}onClick={()=>onSelect(user)}className={user.active?'':'inactive'}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><button onClick={e=>{e.stopPropagation();onDelete(user.id)}}>Delete</button></td></tr>))}</tbody></table></div>)}
export default UserList`,
        },
    ],
};

// All demo projects map
const DEMO_PROJECTS = {
    "demo-org/vulnerable-express-app": DEMO_PROJECT_EXPRESS,
    "demo-org/insecure-flask-api": DEMO_PROJECT_FLASK,
    "demo-org/react-auth-example": DEMO_PROJECT_REACT,
    "demo-group/php-cms-demo": DEMO_PROJECT_EXPRESS,
    "demo-group/go-microservices": DEMO_PROJECT_FLASK,
    "demo-group/ruby-rails-blog": DEMO_PROJECT_REACT,
};

// Default demo code and project
const DEMO_CODE = DEMO_PROJECT_EXPRESS.children
    .find(c => c.name === "src")?.children
    .find(c => c.name === "index.js")?.content || "";

const DEMO_PROJECT_STRUCTURE = DEMO_PROJECT_EXPRESS;

// =============================================
// DEMO VULNERABILITY MAP (filePath → Vulnerability[])
// Maps to the DEMO_PROJECT_EXPRESS file structure
// =============================================
const DEMO_VULNERABILITIES = {
    "src/index.js": [
        {
            id: "demo-vuln-1",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 10,
            explanation: "User input `req.query.id` is concatenated directly into the SQL query string without parameterisation. An attacker can inject arbitrary SQL, leading to data exfiltration or database destruction.",
            bestPractices: "Use parameterised queries or prepared statements: `connection.query('SELECT * FROM users WHERE id = ?', [userId], ...)`",
            details: "SQL Injection via unsanitised query parameter",
        },
        {
            id: "demo-vuln-2",
            severity: "High",
            title: "Cross-Site Scripting (XSS)",
            cweId: "CWE-79",
            lineNumber: 25,
            explanation: "The `username` query parameter is embedded directly into the HTML response without escaping. An attacker can inject `<script>` tags to steal cookies or redirect users.",
            bestPractices: "Escape HTML entities before embedding user input, or use a template engine with auto-escaping enabled.",
            details: "Reflected XSS via unescaped user input in HTML",
        },
        {
            id: "demo-vuln-3",
            severity: "High",
            title: "Path Traversal",
            cweId: "CWE-22",
            lineNumber: 38,
            explanation: "The `filename` parameter is appended to the file path without validation. An attacker can use `../` sequences to read arbitrary files from the server (e.g., `/etc/passwd`).",
            bestPractices: "Validate file names against an allow-list, use `path.resolve()` and verify the resolved path stays within the uploads directory.",
            details: "Path traversal via unsanitised file parameter",
        },
        {
            id: "demo-vuln-4",
            severity: "Critical",
            title: "Hardcoded Credentials",
            cweId: "CWE-798",
            lineNumber: 46,
            explanation: "Database password `password123` is hardcoded in the source code. Anyone with access to the repository can see these credentials.",
            bestPractices: "Store credentials in environment variables or a secrets manager. Never commit secrets to version control.",
            details: "Hardcoded database password in source code",
        },
    ],
    "src/routes/users.js": [
        {
            id: "demo-vuln-5",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 6,
            explanation: "Route parameter `req.params.id` is concatenated directly into the SQL query, allowing injection of arbitrary SQL.",
            bestPractices: "Use parameterised queries: `db.query('SELECT * FROM users WHERE id = ?', [req.params.id], ...)`",
            details: "SQL Injection in user lookup route",
        },
        {
            id: "demo-vuln-6",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 13,
            explanation: "The `name` field from the request body is interpolated directly into a LIKE query using template literals, enabling SQL injection.",
            bestPractices: "Use parameterised queries with wildcards: `db.query('SELECT * FROM users WHERE name LIKE ?', [`%${name}%`], ...)`",
            details: "SQL Injection in user search",
        },
    ],
    "src/routes/auth.js": [
        {
            id: "demo-vuln-7",
            severity: "High",
            title: "Weak Cryptographic Hash (MD5)",
            cweId: "CWE-328",
            lineNumber: 9,
            explanation: "MD5 is cryptographically broken and unsuitable for password hashing. It is vulnerable to collision and preimage attacks, and rainbow table lookups.",
            bestPractices: "Use bcrypt, scrypt, or Argon2 for password hashing with a per-user salt.",
            details: "Passwords hashed with MD5 instead of a modern KDF",
        },
    ],
    "src/routes/admin.js": [
        {
            id: "demo-vuln-8",
            severity: "High",
            title: "Missing Authorization",
            cweId: "CWE-862",
            lineNumber: 5,
            explanation: "The admin `/users` endpoint has no authentication or authorization middleware. Any unauthenticated user can list all users in the database.",
            bestPractices: "Add authentication middleware and verify the user has admin privileges before serving admin routes.",
            details: "Admin endpoint accessible without authentication",
        },
        {
            id: "demo-vuln-9",
            severity: "High",
            title: "Insecure Direct Object Reference (IDOR)",
            cweId: "CWE-639",
            lineNumber: 12,
            explanation: "The delete endpoint accepts a user ID directly from the URL without verifying the requester's authority to delete that specific user.",
            bestPractices: "Verify the authenticated user has permission to perform the action on the specific resource.",
            details: "IDOR in user deletion endpoint",
        },
    ],
    "src/utils/database.js": [
        {
            id: "demo-vuln-10",
            severity: "Critical",
            title: "Hardcoded Credentials",
            cweId: "CWE-798",
            lineNumber: 5,
            explanation: "The root database password `admin123` is hardcoded in the source code with a comment acknowledging the issue.",
            bestPractices: "Use environment variables: `password: process.env.DB_PASSWORD`",
            details: "Hardcoded database root password",
        },
    ],
    "src/utils/crypto.js": [
        {
            id: "demo-vuln-11",
            severity: "Critical",
            title: "Weak Encryption Algorithm (DES-ECB)",
            cweId: "CWE-327",
            lineNumber: 4,
            explanation: "DES is a deprecated algorithm with only 56-bit key strength. ECB mode does not use an IV and reveals patterns in the plaintext.",
            bestPractices: "Use AES-256-GCM or AES-256-CBC with a random IV for encryption.",
            details: "Encryption uses deprecated DES-ECB cipher",
        },
        {
            id: "demo-vuln-12",
            severity: "Medium",
            title: "Insecure Random Number Generation",
            cweId: "CWE-338",
            lineNumber: 11,
            explanation: "`Math.random()` is not cryptographically secure. Tokens generated this way are predictable and can be guessed by an attacker.",
            bestPractices: "Use `crypto.randomBytes(32).toString('hex')` for cryptographically secure token generation.",
            details: "Token generation uses Math.random()",
        },
    ],
    "src/middleware/auth.js": [
        {
            id: "demo-vuln-13",
            severity: "Critical",
            title: "Hardcoded JWT Secret",
            cweId: "CWE-798",
            lineNumber: 3,
            explanation: "The JWT signing secret `super-secret-key-123` is hardcoded. An attacker who discovers this secret can forge valid authentication tokens.",
            bestPractices: "Store the JWT secret in an environment variable and rotate it regularly.",
            details: "JWT secret hardcoded in source code",
        },
    ],
    "config/secrets.js": [
        {
            id: "demo-vuln-14",
            severity: "Critical",
            title: "Exposed Cloud Credentials",
            cweId: "CWE-798",
            lineNumber: 3,
            explanation: "AWS access keys are committed to source control. These credentials could be used to access cloud resources, incur charges, or exfiltrate data.",
            bestPractices: "Use IAM roles, environment variables, or a secrets manager. Never commit cloud credentials to version control. Rotate any exposed keys immediately.",
            details: "AWS credentials exposed in source code",
        },
        {
            id: "demo-vuln-15",
            severity: "Critical",
            title: "Hardcoded JWT Secret",
            cweId: "CWE-798",
            lineNumber: 5,
            explanation: "The JWT secret is stored alongside other secrets in a committed configuration file.",
            bestPractices: "Move all secrets to environment variables or a dedicated secrets management service.",
            details: "JWT signing secret in committed config file",
        },
    ],
};


// =============================================
// DEMO VULNERABILITIES PER REPO (for Results page)
// =============================================
const DEMO_VULNERABILITIES_FLASK = {
    "app/routes.py": [
        {
            id: "flask-vuln-1",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 10,
            explanation: "User input from `request.args.get('q')` is directly interpolated into the SQL query using an f-string. An attacker can inject arbitrary SQL to read, modify, or delete the entire database.",
            bestPractices: "Use SQLAlchemy ORM queries with parameterised filters: `User.query.filter(User.name.like(f'%{query}%'))` or use `db.engine.execute(text(...), {'q': query})`.",
            details: "SQL Injection via f-string interpolation in raw SQL query",
        },
        {
            id: "flask-vuln-2",
            severity: "Critical",
            title: "OS Command Injection",
            cweId: "CWE-78",
            lineNumber: 16,
            explanation: "The `host` parameter from user input is directly passed into `subprocess.check_output` with `shell=True`. An attacker can chain commands with `;`, `&&`, or `|` to execute arbitrary system commands.",
            bestPractices: "Use `subprocess.run(['ping', '-c', '1', host], shell=False)` and validate the host against a strict allowlist or regex pattern.",
            details: "Command Injection via unsanitised subprocess call with shell=True",
        },
        {
            id: "flask-vuln-3",
            severity: "Critical",
            title: "Insecure Deserialization",
            cweId: "CWE-502",
            lineNumber: 23,
            explanation: "`pickle.loads()` on untrusted user input can execute arbitrary code. An attacker can craft a malicious pickle payload to achieve remote code execution.",
            bestPractices: "Never use `pickle` to deserialize untrusted data. Use JSON for data interchange and validate input schema with libraries like Pydantic or Marshmallow.",
            details: "Arbitrary code execution via pickle deserialization of user input",
        },
        {
            id: "flask-vuln-4",
            severity: "High",
            title: "Server-Side Template Injection (SSTI)",
            cweId: "CWE-1336",
            lineNumber: 30,
            explanation: "User input is directly embedded into a Jinja2 template string via `render_template_string`. An attacker can inject template expressions like `{{7*7}}` or `{{config}}` to read secrets or achieve RCE.",
            bestPractices: "Pass user input as a template variable: `render_template_string('<h1>Hello {{name}}!</h1>', name=name)`. Never concatenate user input into template strings.",
            details: "SSTI via unescaped user input in render_template_string",
        },
    ],
    "app/__init__.py": [
        {
            id: "flask-vuln-5",
            severity: "High",
            title: "Debug Mode Enabled in Production",
            cweId: "CWE-489",
            lineNumber: 6,
            explanation: "Flask debug mode (`DEBUG = True`) exposes a Werkzeug interactive debugger that allows arbitrary code execution if accessed remotely.",
            bestPractices: "Set `DEBUG = False` in production. Use environment variables: `app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False') == 'True'`.",
            details: "Debug mode enabled, exposing interactive debugger",
        },
        {
            id: "flask-vuln-6",
            severity: "Critical",
            title: "Hardcoded Secret Key",
            cweId: "CWE-798",
            lineNumber: 7,
            explanation: "The Flask SECRET_KEY is hardcoded as `'dev'`. This key is used for session signing — a known secret allows session forgery and cookie tampering.",
            bestPractices: "Generate a strong random key and store it in an environment variable: `app.config['SECRET_KEY'] = os.environ['SECRET_KEY']`.",
            details: "Hardcoded Flask SECRET_KEY enables session forgery",
        },
    ],
    "app/models.py": [
        {
            id: "flask-vuln-7",
            severity: "High",
            title: "Weak Password Hashing (MD5)",
            cweId: "CWE-328",
            lineNumber: 14,
            explanation: "Passwords are hashed with MD5 via `generate_password_hash(password, method='md5')`. MD5 is cryptographically broken and susceptible to rainbow table and collision attacks.",
            bestPractices: "Use `generate_password_hash(password, method='scrypt')` (default in Werkzeug) or use bcrypt/argon2 via `passlib`.",
            details: "MD5 used for password hashing instead of modern KDF",
        },
        {
            id: "flask-vuln-8",
            severity: "Medium",
            title: "Sensitive Data Exposure in API Response",
            cweId: "CWE-200",
            lineNumber: 17,
            explanation: "The `to_dict()` method exposes `password_hash` and `is_admin` fields in API responses, leaking sensitive internal data.",
            bestPractices: "Exclude sensitive fields from serialization. Return only necessary fields: `{'id': self.id, 'username': self.username, 'email': self.email}`.",
            details: "Password hash and admin flag exposed in API response",
        },
    ],
    "config.py": [
        {
            id: "flask-vuln-9",
            severity: "Critical",
            title: "Hardcoded Database Credentials",
            cweId: "CWE-798",
            lineNumber: 5,
            explanation: "Database connection string with credentials is hardcoded in the configuration file.",
            bestPractices: "Use environment variables for database URIs: `SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')`.",
            details: "Database credentials committed to source control",
        },
    ],
};

const DEMO_VULNERABILITIES_REACT = {
    "src/components/Login.tsx": [
        {
            id: "react-vuln-1",
            severity: "Critical",
            title: "Client-Side Authentication Bypass",
            cweId: "CWE-602",
            lineNumber: 15,
            explanation: "Authentication logic is performed entirely on the client side. The login check uses a simple string comparison against hardcoded credentials stored in the frontend bundle.",
            bestPractices: "Always perform authentication on the server. Use secure session tokens (e.g., HTTP-only cookies) returned from a server-side authentication endpoint.",
            details: "Authentication bypass via client-side credential validation",
        },
        {
            id: "react-vuln-2",
            severity: "High",
            title: "Credentials Stored in Frontend Code",
            cweId: "CWE-798",
            lineNumber: 8,
            explanation: "Admin username and password are hardcoded in the React component. Anyone inspecting the JS bundle can extract these credentials.",
            bestPractices: "Never store credentials in frontend code. All credential validation must happen server-side via secure API endpoints.",
            details: "Hardcoded admin credentials visible in JS bundle",
        },
    ],
    "src/components/Dashboard.tsx": [
        {
            id: "react-vuln-3",
            severity: "High",
            title: "Cross-Site Scripting (XSS) via dangerouslySetInnerHTML",
            cweId: "CWE-79",
            lineNumber: 22,
            explanation: "User-supplied content from URL parameters is rendered using `dangerouslySetInnerHTML` without sanitization, allowing XSS attacks.",
            bestPractices: "Avoid `dangerouslySetInnerHTML`. If HTML rendering is required, use a sanitization library like DOMPurify: `<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}} />`.",
            details: "Stored XSS via unsanitized HTML rendering",
        },
        {
            id: "react-vuln-4",
            severity: "Medium",
            title: "Insecure Direct Object Reference (IDOR)",
            cweId: "CWE-639",
            lineNumber: 35,
            explanation: "User profile data is fetched using a user ID from the URL without server-side authorization. Any authenticated user can access other users' profiles by changing the ID.",
            bestPractices: "Implement server-side authorization checks. Verify the requesting user has permission to access the requested resource.",
            details: "IDOR in profile data fetching endpoint",
        },
    ],
    "src/utils/api.ts": [
        {
            id: "react-vuln-5",
            severity: "High",
            title: "JWT Token Stored in localStorage",
            cweId: "CWE-922",
            lineNumber: 10,
            explanation: "JWT authentication tokens are stored in `localStorage`, which is accessible to any JavaScript running on the page, including injected scripts from XSS attacks.",
            bestPractices: "Store tokens in HTTP-only, Secure, SameSite cookies. If localStorage must be used, implement additional protections like token rotation and short expiry.",
            details: "Authentication tokens vulnerable to XSS exfiltration",
        },
        {
            id: "react-vuln-6",
            severity: "Medium",
            title: "Missing CSRF Protection",
            cweId: "CWE-352",
            lineNumber: 25,
            explanation: "API requests are made without CSRF tokens. State-changing operations (POST, PUT, DELETE) can be triggered by malicious cross-origin requests.",
            bestPractices: "Implement CSRF tokens for all state-changing requests. Use the `SameSite` cookie attribute and verify the `Origin` header on the server.",
            details: "No CSRF protection on state-changing API calls",
        },
    ],
    "src/config/auth.ts": [
        {
            id: "react-vuln-7",
            severity: "Critical",
            title: "Hardcoded JWT Secret in Frontend",
            cweId: "CWE-798",
            lineNumber: 3,
            explanation: "The JWT signing secret is hardcoded in the frontend configuration file. This allows anyone to forge valid JWT tokens and impersonate any user.",
            bestPractices: "JWT secrets must be server-side only. Remove all signing logic from the frontend. Use server-issued tokens verified exclusively on the backend.",
            details: "JWT signing secret exposed in client-side code",
        },
    ],
    "src/components/UserProfile.tsx": [
        {
            id: "react-vuln-8",
            severity: "Medium",
            title: "Sensitive Data Logged to Console",
            cweId: "CWE-532",
            lineNumber: 18,
            explanation: "User PII (email, phone, address) and authentication tokens are logged to `console.log` in production builds. These can be captured by browser extensions or monitoring tools.",
            bestPractices: "Remove all `console.log` statements containing sensitive data. Use a logging library with level control and data masking for production.",
            details: "PII and auth tokens exposed in browser console",
        },
    ],
};

// Combined results map for all demo repos
const DEMO_RESULTS_MAP = {
    "demo-org/vulnerable-express-app": DEMO_VULNERABILITIES,
    "demo-org/insecure-flask-api": DEMO_VULNERABILITIES_FLASK,
    "demo-org/react-auth-example": DEMO_VULNERABILITIES_REACT,
    // Aliases for repos that share the same project structure
    "demo-group/php-cms-demo": DEMO_VULNERABILITIES,
    "demo-group/go-microservices": DEMO_VULNERABILITIES_FLASK,
    "demo-group/ruby-rails-blog": DEMO_VULNERABILITIES_REACT,
};

// =============================================
// DEMO WORKFLOW CONFIGURATIONS PER REPO
// =============================================
const DEMO_WORKFLOW_CONFIGS = {
    "demo-org/vulnerable-express-app": {
        agentModels: {
            reviewer: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            implementation: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            tester: "anthropic.claude-3-5-haiku-20241022-v1:0",
            report: "anthropic.claude-3-sonnet-20240229-v1:0",
        },
        selectedKnowledgeBases: ["demo-sql-injection", "demo-xss", "demo-secrets"],
        selectedPrompts: {
            reviewer: ["demo-prompt-1"],
            implementation: ["demo-prompt-7"],
            tester: ["demo-prompt-13"],
            report: ["demo-prompt-18"],
        },
    },
    "demo-org/insecure-flask-api": {
        agentModels: {
            reviewer: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            implementation: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            tester: "anthropic.claude-3-5-haiku-20241022-v1:0",
            report: "anthropic.claude-3-sonnet-20240229-v1:0",
        },
        selectedKnowledgeBases: ["demo-sql-injection", "demo-auth", "demo-api-security"],
        selectedPrompts: {
            reviewer: ["demo-prompt-2"],
            implementation: ["demo-prompt-8"],
            tester: ["demo-prompt-14"],
            report: ["demo-prompt-19"],
        },
    },
    "demo-org/react-auth-example": {
        agentModels: {
            reviewer: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            implementation: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            tester: "anthropic.claude-3-5-haiku-20241022-v1:0",
            report: "anthropic.claude-3-sonnet-20240229-v1:0",
        },
        selectedKnowledgeBases: ["demo-xss", "demo-auth", "demo-secrets"],
        selectedPrompts: {
            reviewer: ["demo-prompt-4"],
            implementation: ["demo-prompt-11"],
            tester: ["demo-prompt-16"],
            report: ["demo-prompt-21"],
        },
    },
};

// =============================================
// DEMO USE CASE GROUPS (Folders for organizing use cases)
// =============================================
const DEMO_USE_CASE_GROUPS = [
    {
        id: "demo-group-web-security",
        name: "Web Application Security",
        icon: "Globe",
        color: "blue",
        order: 0,
        parentId: null,
        useCaseCount: 4,
    },
    {
        id: "demo-group-infrastructure",
        name: "Infrastructure Security",
        icon: "Server",
        color: "green",
        order: 1,
        parentId: null,
        useCaseCount: 3,
    },
    {
        id: "demo-group-compliance",
        name: "Compliance & Standards",
        icon: "ClipboardCheck",
        color: "purple",
        order: 2,
        parentId: null,
        useCaseCount: 2,
    },
    {
        id: "demo-group-devops",
        name: "DevSecOps",
        icon: "GitBranch",
        color: "orange",
        order: 3,
        parentId: null,
        useCaseCount: 2,
    },
];

// =============================================
// DEMO USE CASES (Knowledge Base Categories)
// =============================================
const DEMO_USE_CASES = [
    {
        id: "demo-sql-injection",
        name: "SQL Injection Prevention",
        description: "Best practices and remediation strategies for SQL injection vulnerabilities including parameterized queries, ORM usage, and input validation.",
        fullDescription: "Comprehensive guide covering SQL injection attack vectors, detection methods, and remediation strategies. Includes examples of parameterized queries, prepared statements, and ORM best practices for Node.js, Python, Java, and PHP applications.",
        shortDescription: "Best practices and remediation strategies for SQL injection vulnerabilities...",
        icon: "Database",
        color: "default",
        groupId: "demo-group-web-security",
        order: 0,
        pdfCount: 5,
        formattedTotalSize: "4.2 MB",
    },
    {
        id: "demo-xss",
        name: "XSS Defense Strategies",
        description: "Cross-site scripting prevention techniques including output encoding, Content Security Policy, and sanitization libraries.",
        fullDescription: "Complete XSS defense guide covering reflected, stored, and DOM-based XSS attacks. Includes implementation guides for CSP headers, HTML sanitization, and secure templating practices.",
        shortDescription: "Cross-site scripting prevention techniques including output encoding...",
        icon: "Shield",
        color: "default",
        groupId: "demo-group-web-security",
        order: 1,
        pdfCount: 4,
        formattedTotalSize: "3.1 MB",
    },
    {
        id: "demo-auth",
        name: "Authentication Best Practices",
        description: "Secure authentication implementation patterns including password hashing, session management, and multi-factor authentication.",
        fullDescription: "Industry-standard authentication security practices covering bcrypt/argon2 password hashing, secure session handling, JWT best practices, OAuth 2.0 implementation, and MFA integration guides.",
        shortDescription: "Secure authentication implementation patterns including password hashing...",
        icon: "Lock",
        color: "default",
        groupId: "demo-group-web-security",
        order: 2,
        pdfCount: 6,
        formattedTotalSize: "5.4 MB",
    },
    {
        id: "demo-secrets",
        name: "Secrets Management",
        description: "Guidelines for managing credentials, API keys, and sensitive configuration data securely in applications.",
        fullDescription: "Best practices for secrets management including environment variables, secrets managers (AWS Secrets Manager, HashiCorp Vault), .env file handling, and CI/CD pipeline security.",
        shortDescription: "Guidelines for managing credentials, API keys, and sensitive configuration...",
        icon: "Key",
        color: "default",
        groupId: null,
        order: 0,
        pdfCount: 4,
        formattedTotalSize: "2.8 MB",
    },
    {
        id: "demo-api-security",
        name: "API Security Standards",
        description: "REST and GraphQL API security patterns, rate limiting, input validation, and authentication mechanisms.",
        fullDescription: "Complete API security guide covering authentication (OAuth, API keys, JWT), authorization patterns, rate limiting, input validation, CORS configuration, and API gateway security.",
        shortDescription: "REST and GraphQL API security patterns, rate limiting, and authentication...",
        icon: "Globe",
        color: "default",
        groupId: "demo-group-web-security",
        order: 3,
        pdfCount: 5,
        formattedTotalSize: "4.7 MB",
    },
    {
        id: "demo-compliance",
        name: "Security Compliance",
        description: "OWASP Top 10, PCI-DSS, SOC 2, and GDPR compliance requirements for secure software development.",
        fullDescription: "Comprehensive compliance documentation covering OWASP Top 10 2021, PCI-DSS requirements for payment applications, SOC 2 Type II controls, and GDPR data protection requirements.",
        shortDescription: "OWASP Top 10, PCI-DSS, SOC 2, and GDPR compliance requirements...",
        icon: "ClipboardCheck",
        color: "default",
        groupId: "demo-group-compliance",
        order: 0,
        pdfCount: 8,
        formattedTotalSize: "12.3 MB",
    },
    {
        id: "demo-crypto",
        name: "Cryptography Guidelines",
        description: "Encryption algorithms, key management, and cryptographic best practices for secure data handling.",
        fullDescription: "Complete cryptography guide covering symmetric/asymmetric encryption, hashing algorithms, digital signatures, key rotation strategies, and TLS/SSL configuration.",
        shortDescription: "Encryption algorithms, key management, and cryptographic best practices...",
        icon: "KeyRound",
        color: "default",
        groupId: "demo-group-compliance",
        order: 1,
        pdfCount: 5,
        formattedTotalSize: "3.8 MB",
    },
    {
        id: "demo-logging",
        name: "Security Logging & Monitoring",
        description: "Logging best practices, audit trails, intrusion detection, and security monitoring strategies.",
        fullDescription: "Security logging and monitoring guide covering log levels, sensitive data redaction, centralized logging, SIEM integration, and alerting strategies for security events.",
        shortDescription: "Logging best practices, audit trails, and security monitoring strategies...",
        icon: "FileSearch",
        color: "default",
        groupId: "demo-group-infrastructure",
        order: 0,
        pdfCount: 4,
        formattedTotalSize: "2.9 MB",
    },
    {
        id: "demo-container",
        name: "Container Security",
        description: "Docker and Kubernetes security hardening, image scanning, and container runtime protection.",
        fullDescription: "Container security best practices covering Docker image hardening, Kubernetes RBAC, network policies, secrets management in containers, and vulnerability scanning pipelines.",
        shortDescription: "Docker and Kubernetes security hardening, image scanning...",
        icon: "Container",
        color: "default",
        groupId: "demo-group-infrastructure",
        order: 1,
        pdfCount: 6,
        formattedTotalSize: "5.1 MB",
    },
    {
        id: "demo-cloud",
        name: "Cloud Security Posture",
        description: "AWS, Azure, and GCP security configurations, IAM policies, and cloud-native security controls.",
        fullDescription: "Cloud security configuration guide covering IAM best practices, security groups, VPC design, encryption at rest/transit, and cloud security posture management (CSPM).",
        shortDescription: "AWS, Azure, and GCP security configurations and IAM policies...",
        icon: "Cloud",
        color: "default",
        groupId: "demo-group-infrastructure",
        order: 2,
        pdfCount: 7,
        formattedTotalSize: "6.4 MB",
    },
    {
        id: "demo-secure-sdlc",
        name: "Secure SDLC Practices",
        description: "Security integration in development lifecycle, threat modeling, and security testing methodologies.",
        fullDescription: "Secure Software Development Lifecycle practices including threat modeling, security requirements, code review processes, SAST/DAST integration, and security testing automation.",
        shortDescription: "Security integration in development lifecycle and threat modeling...",
        icon: "GitBranch",
        color: "default",
        groupId: "demo-group-devops",
        order: 0,
        pdfCount: 5,
        formattedTotalSize: "4.0 MB",
    },
    {
        id: "demo-mobile",
        name: "Mobile App Security",
        description: "iOS and Android security best practices, secure storage, certificate pinning, and mobile threat defense.",
        fullDescription: "Mobile application security guide covering secure data storage, network security, authentication, code obfuscation, anti-tampering measures, and OWASP Mobile Top 10.",
        shortDescription: "iOS and Android security best practices and secure storage...",
        icon: "Smartphone",
        color: "default",
        groupId: null,
        order: 1,
        pdfCount: 4,
        formattedTotalSize: "3.2 MB",
    },
    {
        id: "demo-incident",
        name: "Incident Response",
        description: "Security incident handling procedures, forensics basics, and breach notification requirements.",
        fullDescription: "Incident response playbook covering detection, containment, eradication, recovery, and lessons learned. Includes forensic evidence collection and regulatory notification timelines.",
        shortDescription: "Security incident handling procedures and forensics basics...",
        icon: "AlertTriangle",
        color: "default",
        groupId: null,
        order: 2,
        pdfCount: 3,
        formattedTotalSize: "2.1 MB",
    },
    {
        id: "demo-devsecops",
        name: "DevSecOps Pipeline",
        description: "CI/CD security integration, automated security testing, and pipeline hardening strategies.",
        fullDescription: "DevSecOps implementation guide covering security gates in CI/CD, automated SAST/DAST/SCA, infrastructure as code security scanning, and secrets detection in pipelines.",
        shortDescription: "CI/CD security integration and automated security testing...",
        icon: "GitMerge",
        color: "default",
        groupId: "demo-group-devops",
        order: 1,
        pdfCount: 5,
        formattedTotalSize: "4.3 MB",
    },
    {
        id: "demo-access-control",
        name: "Access Control Patterns",
        description: "RBAC, ABAC, and authorization patterns for securing application resources and data.",
        fullDescription: "Access control implementation guide covering role-based access control, attribute-based access control, policy engines, and least privilege principles for application security.",
        shortDescription: "RBAC, ABAC, and authorization patterns for securing resources...",
        icon: "Users",
        color: "default",
        groupId: null,
        order: 3,
        pdfCount: 4,
        formattedTotalSize: "3.0 MB",
    },
];

// =============================================
// DEMO DOCUMENTS (PDFs with Folders)
// =============================================
const DEMO_DOCUMENTS = {
    "demo-sql-injection": [
        { id: "doc-1", name: "OWASP SQL Injection Prevention Cheat Sheet.pdf", size: "856 KB", type: "pdf", folder: null },
        { id: "doc-2", name: "Parameterized Queries Guide.pdf", size: "1.1 MB", type: "pdf", folder: null },
        { id: "doc-3", name: "Node.js Database Security.pdf", size: "512 KB", type: "pdf", folder: "Node.js" },
        { id: "doc-4", name: "Python SQLAlchemy Security.pdf", size: "678 KB", type: "pdf", folder: "Python" },
        { id: "doc-5", name: "Java Hibernate Secure Queries.pdf", size: "934 KB", type: "pdf", folder: "Java" },
    ],
    "demo-xss": [
        { id: "doc-6", name: "XSS Prevention Guide.pdf", size: "923 KB", type: "pdf", folder: null },
        { id: "doc-7", name: "Content Security Policy Implementation.pdf", size: "876 KB", type: "pdf", folder: null },
        { id: "doc-8", name: "React XSS Prevention.pdf", size: "534 KB", type: "pdf", folder: "Frontend" },
        { id: "doc-9", name: "Angular Security Context.pdf", size: "467 KB", type: "pdf", folder: "Frontend" },
    ],
    "demo-auth": [
        { id: "doc-10", name: "Password Hashing Best Practices.pdf", size: "654 KB", type: "pdf", folder: null },
        { id: "doc-11", name: "JWT Security Guide.pdf", size: "789 KB", type: "pdf", folder: "Tokens" },
        { id: "doc-12", name: "OAuth 2.0 Implementation.pdf", size: "1.2 MB", type: "pdf", folder: "OAuth" },
        { id: "doc-13", name: "Multi-Factor Authentication Setup.pdf", size: "456 KB", type: "pdf", folder: "MFA" },
        { id: "doc-14", name: "Session Management Security.pdf", size: "567 KB", type: "pdf", folder: "Sessions" },
        { id: "doc-15", name: "Bcrypt vs Argon2 Comparison.pdf", size: "345 KB", type: "pdf", folder: null },
    ],
    "demo-secrets": [
        { id: "doc-16", name: "Environment Variables Guide.pdf", size: "345 KB", type: "pdf", folder: null },
        { id: "doc-17", name: "AWS Secrets Manager Tutorial.pdf", size: "867 KB", type: "pdf", folder: "AWS" },
        { id: "doc-18", name: "HashiCorp Vault Setup.pdf", size: "1.1 MB", type: "pdf", folder: "Vault" },
        { id: "doc-19", name: "CI/CD Secrets Best Practices.pdf", size: "523 KB", type: "pdf", folder: "CI/CD" },
    ],
    "demo-api-security": [
        { id: "doc-20", name: "REST API Security Checklist.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-21", name: "GraphQL Security Guide.pdf", size: "892 KB", type: "pdf", folder: "GraphQL" },
        { id: "doc-22", name: "Rate Limiting Implementation.pdf", size: "456 KB", type: "pdf", folder: null },
        { id: "doc-23", name: "API Gateway Security.pdf", size: "734 KB", type: "pdf", folder: null },
        { id: "doc-24", name: "CORS Configuration Guide.pdf", size: "389 KB", type: "pdf", folder: null },
    ],
    "demo-compliance": [
        { id: "doc-25", name: "OWASP Top 10 2021 Overview.pdf", size: "1.5 MB", type: "pdf", folder: "OWASP" },
        { id: "doc-26", name: "OWASP Testing Guide v4.pdf", size: "2.3 MB", type: "pdf", folder: "OWASP" },
        { id: "doc-27", name: "PCI-DSS v4.0 Requirements.pdf", size: "1.8 MB", type: "pdf", folder: "PCI-DSS" },
        { id: "doc-28", name: "PCI-DSS Code Review Checklist.pdf", size: "567 KB", type: "pdf", folder: "PCI-DSS" },
        { id: "doc-29", name: "SOC 2 Security Controls.pdf", size: "1.2 MB", type: "pdf", folder: "SOC2" },
        { id: "doc-30", name: "GDPR Developer Guide.pdf", size: "934 KB", type: "pdf", folder: "GDPR" },
        { id: "doc-31", name: "GDPR Data Protection Checklist.pdf", size: "456 KB", type: "pdf", folder: "GDPR" },
        { id: "doc-32", name: "Security Audit Template.pdf", size: "678 KB", type: "pdf", folder: null },
    ],
    "demo-crypto": [
        { id: "doc-33", name: "AES Encryption Implementation.pdf", size: "756 KB", type: "pdf", folder: null },
        { id: "doc-34", name: "RSA Key Management Guide.pdf", size: "834 KB", type: "pdf", folder: "Keys" },
        { id: "doc-35", name: "TLS 1.3 Configuration.pdf", size: "623 KB", type: "pdf", folder: "TLS" },
        { id: "doc-36", name: "Hashing Algorithms Comparison.pdf", size: "512 KB", type: "pdf", folder: null },
        { id: "doc-37", name: "Key Rotation Best Practices.pdf", size: "445 KB", type: "pdf", folder: "Keys" },
    ],
    "demo-logging": [
        { id: "doc-38", name: "Security Logging Standards.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-39", name: "Audit Trail Implementation.pdf", size: "723 KB", type: "pdf", folder: null },
        { id: "doc-40", name: "SIEM Integration Guide.pdf", size: "856 KB", type: "pdf", folder: "SIEM" },
        { id: "doc-41", name: "Log Redaction Patterns.pdf", size: "389 KB", type: "pdf", folder: null },
    ],
    "demo-container": [
        { id: "doc-42", name: "Docker Security Hardening.pdf", size: "923 KB", type: "pdf", folder: "Docker" },
        { id: "doc-43", name: "Kubernetes RBAC Guide.pdf", size: "1.1 MB", type: "pdf", folder: "K8s" },
        { id: "doc-44", name: "Container Image Scanning.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-45", name: "K8s Network Policies.pdf", size: "534 KB", type: "pdf", folder: "K8s" },
        { id: "doc-46", name: "Pod Security Standards.pdf", size: "445 KB", type: "pdf", folder: "K8s" },
        { id: "doc-47", name: "Secrets in Containers.pdf", size: "512 KB", type: "pdf", folder: null },
    ],
    "demo-cloud": [
        { id: "doc-48", name: "AWS Security Best Practices.pdf", size: "1.2 MB", type: "pdf", folder: "AWS" },
        { id: "doc-49", name: "AWS IAM Policy Guide.pdf", size: "856 KB", type: "pdf", folder: "AWS" },
        { id: "doc-50", name: "Azure Security Center.pdf", size: "934 KB", type: "pdf", folder: "Azure" },
        { id: "doc-51", name: "GCP Security Foundations.pdf", size: "1.1 MB", type: "pdf", folder: "GCP" },
        { id: "doc-52", name: "VPC Security Design.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-53", name: "Cloud Encryption Guide.pdf", size: "567 KB", type: "pdf", folder: null },
        { id: "doc-54", name: "CSPM Implementation.pdf", size: "723 KB", type: "pdf", folder: null },
    ],
    "demo-secure-sdlc": [
        { id: "doc-55", name: "Threat Modeling Guide.pdf", size: "934 KB", type: "pdf", folder: null },
        { id: "doc-56", name: "Security Requirements Template.pdf", size: "456 KB", type: "pdf", folder: null },
        { id: "doc-57", name: "Code Review Checklist.pdf", size: "389 KB", type: "pdf", folder: "Review" },
        { id: "doc-58", name: "SAST Tool Integration.pdf", size: "678 KB", type: "pdf", folder: "Testing" },
        { id: "doc-59", name: "DAST Implementation Guide.pdf", size: "756 KB", type: "pdf", folder: "Testing" },
    ],
    "demo-mobile": [
        { id: "doc-60", name: "iOS Keychain Security.pdf", size: "623 KB", type: "pdf", folder: "iOS" },
        { id: "doc-61", name: "Android Secure Storage.pdf", size: "678 KB", type: "pdf", folder: "Android" },
        { id: "doc-62", name: "Certificate Pinning Guide.pdf", size: "512 KB", type: "pdf", folder: null },
        { id: "doc-63", name: "OWASP Mobile Top 10.pdf", size: "856 KB", type: "pdf", folder: null },
    ],
    "demo-incident": [
        { id: "doc-64", name: "Incident Response Playbook.pdf", size: "934 KB", type: "pdf", folder: null },
        { id: "doc-65", name: "Forensic Evidence Collection.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-66", name: "Breach Notification Timeline.pdf", size: "345 KB", type: "pdf", folder: null },
    ],
    "demo-devsecops": [
        { id: "doc-67", name: "CI/CD Security Gates.pdf", size: "756 KB", type: "pdf", folder: null },
        { id: "doc-68", name: "Pipeline Hardening Guide.pdf", size: "623 KB", type: "pdf", folder: null },
        { id: "doc-69", name: "SCA Integration Tutorial.pdf", size: "534 KB", type: "pdf", folder: "Tools" },
        { id: "doc-70", name: "Secrets Detection in Code.pdf", size: "445 KB", type: "pdf", folder: "Tools" },
        { id: "doc-71", name: "IaC Security Scanning.pdf", size: "678 KB", type: "pdf", folder: "Tools" },
    ],
    "demo-access-control": [
        { id: "doc-72", name: "RBAC Implementation Guide.pdf", size: "756 KB", type: "pdf", folder: null },
        { id: "doc-73", name: "ABAC Policy Patterns.pdf", size: "678 KB", type: "pdf", folder: null },
        { id: "doc-74", name: "Least Privilege Principles.pdf", size: "534 KB", type: "pdf", folder: null },
        { id: "doc-75", name: "Policy Engine Integration.pdf", size: "623 KB", type: "pdf", folder: "Engines" },
    ],
};

// =============================================
// DEMO PROMPTS (Expanded for each agent)
// =============================================
const DEMO_PROMPTS = {
    reviewer: [
        {
            id: "demo-prompt-1",
            title: "Security Code Review",
            text: "Analyze the provided code for security vulnerabilities. Focus on OWASP Top 10 issues including injection flaws, broken authentication, sensitive data exposure, and security misconfigurations. Provide severity ratings and line-specific findings.",
            order: 0,
            isDefault: true,
        },
        {
            id: "demo-prompt-2",
            title: "Deep Vulnerability Scan",
            text: "Perform a comprehensive security analysis identifying all potential vulnerabilities, their attack vectors, and potential impact. Include CVE references where applicable.",
            order: 1,
            isDefault: true,
        },
        {
            id: "demo-prompt-3",
            title: "SQL Injection Analysis",
            text: "Focus specifically on SQL injection vulnerabilities. Identify all database query patterns, classify injection types (in-band, blind, out-of-band), and assess exploitability.",
            order: 2,
            isDefault: true,
        },
        {
            id: "demo-prompt-4",
            title: "Authentication Review",
            text: "Review authentication and authorization mechanisms. Check for weak password policies, insecure session management, JWT vulnerabilities, and missing access controls.",
            order: 3,
        },
        {
            id: "demo-prompt-5",
            title: "Cryptographic Assessment",
            text: "Evaluate cryptographic implementations. Identify weak algorithms, hardcoded secrets, improper key management, and insecure random number generation.",
            order: 4,
        },
        {
            id: "demo-prompt-6",
            title: "Dependency Audit",
            text: "Check for vulnerable dependencies. Cross-reference with CVE databases, identify outdated packages, and highlight transitive dependency risks.",
            order: 5,
        },
    ],
    implementation: [
        {
            id: "demo-prompt-7",
            title: "Generate Secure Fix",
            text: "Generate secure code to remediate the identified vulnerabilities. Follow security best practices and include comments explaining the security improvements. Maintain code functionality while eliminating security risks.",
            order: 0,
            isDefault: true,
        },
        {
            id: "demo-prompt-8",
            title: "Refactor for Security",
            text: "Refactor the vulnerable code following secure coding guidelines. Implement input validation, output encoding, parameterized queries, and proper error handling.",
            order: 1,
            isDefault: true,
        },
        {
            id: "demo-prompt-9",
            title: "Parameterize SQL Queries",
            text: "Convert all raw SQL queries to parameterized queries or ORM methods. Ensure proper type checking and prevent SQL injection while maintaining query functionality.",
            order: 2,
            isDefault: true,
        },
        {
            id: "demo-prompt-10",
            title: "Implement Input Validation",
            text: "Add comprehensive input validation using whitelist approach. Implement schema validation, type checking, length limits, and format validation for all user inputs.",
            order: 3,
        },
        {
            id: "demo-prompt-11",
            title: "Secure Authentication Flow",
            text: "Rewrite authentication with bcrypt/argon2 hashing, secure session management, CSRF protection, and rate limiting. Include password strength requirements.",
            order: 4,
        },
        {
            id: "demo-prompt-12",
            title: "Add Security Headers",
            text: "Implement security headers including CSP, X-Frame-Options, X-Content-Type-Options, HSTS, and configure CORS properly. Include middleware setup code.",
            order: 5,
        },
    ],
    tester: [
        {
            id: "demo-prompt-13",
            title: "Security Test Cases",
            text: "Generate security test cases to verify the remediation is effective. Include positive and negative test scenarios, edge cases, and regression tests for the original vulnerabilities.",
            order: 0,
            isDefault: true,
        },
        {
            id: "demo-prompt-14",
            title: "SQL Injection Tests",
            text: "Create comprehensive SQL injection test cases including union-based, boolean-blind, time-based blind, and error-based payloads. Include parameterized query validation tests.",
            order: 1,
            isDefault: true,
        },
        {
            id: "demo-prompt-15",
            title: "XSS Test Suite",
            text: "Generate XSS test cases covering reflected, stored, and DOM-based attacks. Include payload encoding variations, filter bypass techniques, and output encoding validation.",
            order: 2,
            isDefault: true,
        },
        {
            id: "demo-prompt-16",
            title: "Authentication Tests",
            text: "Create tests for authentication security: password strength, session fixation, brute force protection, account lockout, password reset flow, and JWT validation.",
            order: 3,
        },
        {
            id: "demo-prompt-17",
            title: "API Security Tests",
            text: "Generate API security tests including authorization bypass, IDOR, rate limiting, input validation, and proper error handling without information disclosure.",
            order: 4,
        },
    ],
    report: [
        {
            id: "demo-prompt-18",
            title: "Executive Summary Report",
            text: "Generate an executive summary of the security findings, remediation steps taken, and verification results. Include risk ratings, business impact, and recommendations for further security improvements.",
            order: 0,
            isDefault: true,
        },
        {
            id: "demo-prompt-19",
            title: "Technical Findings Report",
            text: "Create a detailed technical report with vulnerability descriptions, affected code locations, attack scenarios, remediation code, and verification evidence.",
            order: 1,
            isDefault: true,
        },
        {
            id: "demo-prompt-20",
            title: "Compliance Report",
            text: "Generate a compliance-focused report mapping findings to OWASP Top 10, PCI-DSS requirements, and SOC 2 controls. Include remediation status and evidence.",
            order: 2,
            isDefault: true,
        },
        {
            id: "demo-prompt-21",
            title: "Developer Remediation Guide",
            text: "Create a developer-friendly guide explaining each vulnerability, why it's dangerous, how to fix it with code examples, and best practices to prevent recurrence.",
            order: 3,
        },
        {
            id: "demo-prompt-22",
            title: "Risk Assessment Matrix",
            text: "Generate a risk assessment with CVSS scores, likelihood ratings, business impact analysis, and prioritized remediation roadmap with effort estimates.",
            order: 4,
        },
    ],
};

// =============================================
// DEMO CONTEXT PROVIDER
// =============================================
export function DemoProvider({ children }) {
    const pathname = usePathname();

    // SECURITY: Derive demo mode from pathname, not state
    // This ensures demo mode cannot be manipulated via React devtools
    const isDemoMode = isDemoPath(pathname);

    const [currentDemoProject, setCurrentDemoProject] = useState(() => {
        if (typeof window === 'undefined') return "demo-org/vulnerable-express-app";
        try {
            const saved = sessionStorage.getItem('vulniq_demo_current_project');
            return saved && DEMO_PROJECTS[saved] ? saved : "demo-org/vulnerable-express-app";
        } catch { return "demo-org/vulnerable-express-app"; }
    });



    // Clean up demo storage when exiting demo mode
    useEffect(() => {
        // Track previous demo mode state
        const wasInDemoMode = sessionStorage.getItem('vulniq_was_demo_mode') === 'true';

        if (isDemoMode) {
            sessionStorage.setItem('vulniq_was_demo_mode', 'true');
        } else if (wasInDemoMode && !isDemoMode) {
            // User exited demo mode - clear all demo data
            clearDemoStorage();
            sessionStorage.removeItem('vulniq_was_demo_mode');
        }
    }, [isDemoMode, pathname]);

    // Note: enableDemoMode/disableDemoMode are kept for backwards compatibility
    // but they no longer do anything - demo mode is now derived from pathname
    const enableDemoMode = useCallback(() => {
        console.warn('[DemoContext] enableDemoMode is deprecated. Demo mode is now derived from pathname.');
    }, []);

    const disableDemoMode = useCallback(() => {
        console.warn('[DemoContext] disableDemoMode is deprecated. Demo mode is now derived from pathname.');
        // Clear demo storage when explicitly called
        clearDemoStorage();
    }, []);

    const switchDemoProject = useCallback((projectFullName) => {
        if (DEMO_PROJECTS[projectFullName]) {
            setCurrentDemoProject(projectFullName);
            try { sessionStorage.setItem('vulniq_demo_current_project', projectFullName); } catch {}
            return DEMO_PROJECTS[projectFullName];
        }
        return null;
    }, []);

    const getDemoCode = useCallback(() => DEMO_CODE, []);
    const getDemoProjectStructure = useCallback(() =>
        DEMO_PROJECTS[currentDemoProject] || DEMO_PROJECT_STRUCTURE,
        [currentDemoProject]);
    const getDemoUseCases = useCallback(() => DEMO_USE_CASES, []);
    const getDemoDocuments = useCallback(() => DEMO_DOCUMENTS, []);
    const getDemoPrompts = useCallback(() => DEMO_PROMPTS, []);
    const getDemoGithubRepos = useCallback(() => DEMO_GITHUB_REPOS, []);
    const getDemoGitlabRepos = useCallback(() => DEMO_GITLAB_REPOS, []);
    const getDemoProjects = useCallback(() => DEMO_PROJECTS, []);
    const getDemoResultsForRepo = useCallback((repoFullName) => {
        const vulnMap = DEMO_RESULTS_MAP[repoFullName] || DEMO_RESULTS_MAP["demo-org/vulnerable-express-app"];
        // Flatten the file-keyed vulnerability map into a flat array suitable for the Results component
        const flatVulns = [];
        let idx = 1;
        for (const [fileName, vulns] of Object.entries(vulnMap)) {
            for (const v of vulns) {
                flatVulns.push({
                    id: idx++,
                    severity: v.severity,
                    title: v.title,
                    type: v.cweId || "CWE-000",
                    details: v.details,
                    fileName,
                    cweId: v.cweId,
                    vulnerableCode: v.vulnerableCode || "",
                    explanation: v.explanation,
                    bestPractices: v.bestPractices,
                });
            }
        }
        return flatVulns;
    }, []);
    const getDemoWorkflowConfig = useCallback((repoFullName) => {
        return DEMO_WORKFLOW_CONFIGS[repoFullName] || DEMO_WORKFLOW_CONFIGS["demo-org/vulnerable-express-app"];
    }, []);

    return (
        <DemoContext.Provider
            value={{
                isDemoMode,
                enableDemoMode,
                disableDemoMode,
                currentDemoProject,
                switchDemoProject,
                getDemoCode,
                getDemoProjectStructure,
                getDemoUseCases,
                getDemoDocuments,
                getDemoPrompts,
                getDemoGithubRepos,
                getDemoGitlabRepos,
                getDemoProjects,
                getDemoResultsForRepo,
                getDemoWorkflowConfig,
                // Export constants for direct access
                DEMO_CODE,
                DEMO_PROJECT_STRUCTURE,
                DEMO_USE_CASES,
                DEMO_USE_CASE_GROUPS,
                DEMO_DOCUMENTS,
                DEMO_PROMPTS,
                DEMO_GITHUB_REPOS,
                DEMO_GITLAB_REPOS,
                DEMO_PROJECTS,
                DEMO_VULNERABILITIES,
                DEMO_RESULTS_MAP,
                DEMO_WORKFLOW_CONFIGS,
            }}
        >
            {children}
        </DemoContext.Provider>
    );
}

export function useDemo() {
    const context = useContext(DemoContext);
    if (!context) {
        throw new Error('useDemo must be used within a DemoProvider');
    }
    return context;
}

export {
    DEMO_CODE,
    DEMO_PROJECT_STRUCTURE,
    DEMO_USE_CASES,
    DEMO_USE_CASE_GROUPS,
    DEMO_DOCUMENTS,
    DEMO_PROMPTS,
    DEMO_GITHUB_REPOS,
    DEMO_GITLAB_REPOS,
    DEMO_PROJECTS,
    DEMO_VULNERABILITIES,
    DEMO_RESULTS_MAP,
    DEMO_WORKFLOW_CONFIGS,
};
