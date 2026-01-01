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
    AWS_ACCESS_KEY: 'AKIAIOSFODNN7EXAMPLE',
    AWS_SECRET_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
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
    AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'
    AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'`,
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
  apiKey: 'sk-live-1234567890abcdef',
  googleMapsKey: 'AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxx',
  stripeSecretKey: 'sk_live_xxxxxxxxxxxxx',
  firebaseConfig: {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxx",
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
        },
        {
            id: "demo-prompt-2",
            title: "Deep Vulnerability Scan",
            text: "Perform a comprehensive security analysis identifying all potential vulnerabilities, their attack vectors, and potential impact. Include CVE references where applicable.",
            order: 1,
        },
        {
            id: "demo-prompt-3",
            title: "SQL Injection Analysis",
            text: "Focus specifically on SQL injection vulnerabilities. Identify all database query patterns, classify injection types (in-band, blind, out-of-band), and assess exploitability.",
            order: 2,
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
        },
        {
            id: "demo-prompt-8",
            title: "Refactor for Security",
            text: "Refactor the vulnerable code following secure coding guidelines. Implement input validation, output encoding, parameterized queries, and proper error handling.",
            order: 1,
        },
        {
            id: "demo-prompt-9",
            title: "Parameterize SQL Queries",
            text: "Convert all raw SQL queries to parameterized queries or ORM methods. Ensure proper type checking and prevent SQL injection while maintaining query functionality.",
            order: 2,
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
        },
        {
            id: "demo-prompt-14",
            title: "SQL Injection Tests",
            text: "Create comprehensive SQL injection test cases including union-based, boolean-blind, time-based blind, and error-based payloads. Include parameterized query validation tests.",
            order: 1,
        },
        {
            id: "demo-prompt-15",
            title: "XSS Test Suite",
            text: "Generate XSS test cases covering reflected, stored, and DOM-based attacks. Include payload encoding variations, filter bypass techniques, and output encoding validation.",
            order: 2,
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
        },
        {
            id: "demo-prompt-19",
            title: "Technical Findings Report",
            text: "Create a detailed technical report with vulnerability descriptions, affected code locations, attack scenarios, remediation code, and verification evidence.",
            order: 1,
        },
        {
            id: "demo-prompt-20",
            title: "Compliance Report",
            text: "Generate a compliance-focused report mapping findings to OWASP Top 10, PCI-DSS requirements, and SOC 2 controls. Include remediation status and evidence.",
            order: 2,
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
    
    const [currentDemoProject, setCurrentDemoProject] = useState("demo-org/vulnerable-express-app");
    
    // Shared code locked state - used to enable/disable workflow configuration
    const [isCodeLocked, setIsCodeLocked] = useState(false);

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

    return (
        <DemoContext.Provider
            value={{
                isDemoMode,
                enableDemoMode,
                disableDemoMode,
                currentDemoProject,
                switchDemoProject,
                isCodeLocked,
                setIsCodeLocked,
                getDemoCode,
                getDemoProjectStructure,
                getDemoUseCases,
                getDemoDocuments,
                getDemoPrompts,
                getDemoGithubRepos,
                getDemoGitlabRepos,
                getDemoProjects,
                // Export constants for direct access
                DEMO_CODE,
                DEMO_PROJECT_STRUCTURE,
                DEMO_USE_CASES,
                DEMO_DOCUMENTS,
                DEMO_PROMPTS,
                DEMO_GITHUB_REPOS,
                DEMO_GITLAB_REPOS,
                DEMO_PROJECTS,
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
    DEMO_DOCUMENTS,
    DEMO_PROMPTS,
    DEMO_GITHUB_REPOS,
    DEMO_GITLAB_REPOS,
    DEMO_PROJECTS,
};
