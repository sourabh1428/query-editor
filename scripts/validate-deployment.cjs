#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that all required files and configurations are present for Render deployment
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // Root configuration files
  'render.yaml',
  'Dockerfile',
  'nginx.conf',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  
  // Backend files
  'backend/Dockerfile',
  'backend/requirements.txt',
  'backend/app.py',
  'backend/db/init_db.py',
  'backend/db/init.sql',
  
  // Frontend files
  'src/config.ts',
  'src/services/api.ts',
  'src/contexts/AuthContext.tsx',
  'src/main.tsx',
  'index.html',
];

console.log('🔍 Validating deployment configuration...\n');

let isValid = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    isValid = false;
  }
});

// Validate render.yaml
console.log('\n🔧 Validating render.yaml:');
try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8');
  
  // Check for required services
  const requiredServices = ['sql-analytics-platform', 'sql-analytics-platform-api', 'sql-analytics-db'];
  requiredServices.forEach(service => {
    if (renderConfig.includes(service)) {
      console.log(`  ✅ Service: ${service}`);
    } else {
      console.log(`  ❌ Service: ${service} - MISSING`);
      isValid = false;
    }
  });
  
} catch (error) {
  console.log('  ❌ Error reading render.yaml:', error.message);
  isValid = false;
}

// Validate package.json
console.log('\n📦 Validating package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check build script
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('  ✅ Build script present');
  } else {
    console.log('  ❌ Build script missing');
    isValid = false;
  }
  
  // Check essential dependencies
  const essentialDeps = ['react', 'react-dom', 'vite', '@vitejs/plugin-react'];
  essentialDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`  ✅ ${dep}`);
    } else {
      console.log(`  ❌ ${dep} - MISSING`);
      isValid = false;
    }
  });
  
} catch (error) {
  console.log('  ❌ Error reading package.json:', error.message);
  isValid = false;
}

// Validate backend requirements
console.log('\n🐍 Validating backend requirements:');
try {
  const requirements = fs.readFileSync('backend/requirements.txt', 'utf8');
  const essentialPkgs = ['flask', 'gunicorn', 'psycopg2-binary', 'flask-cors'];
  
  essentialPkgs.forEach(pkg => {
    if (requirements.includes(pkg)) {
      console.log(`  ✅ ${pkg}`);
    } else {
      console.log(`  ❌ ${pkg} - MISSING`);
      isValid = false;
    }
  });
  
} catch (error) {
  console.log('  ❌ Error reading backend/requirements.txt:', error.message);
  isValid = false;
}

// Check Dockerfile configurations
console.log('\n🐳 Validating Dockerfiles:');
try {
  // Frontend Dockerfile
  const frontendDockerfile = fs.readFileSync('Dockerfile', 'utf8');
  if (frontendDockerfile.includes('nginx')) {
    console.log('  ✅ Frontend Dockerfile - Nginx configured');
  } else {
    console.log('  ❌ Frontend Dockerfile - Missing Nginx configuration');
    isValid = false;
  }
  
  // Backend Dockerfile
  const backendDockerfile = fs.readFileSync('backend/Dockerfile', 'utf8');
  if (backendDockerfile.includes('gunicorn')) {
    console.log('  ✅ Backend Dockerfile - Gunicorn configured');
  } else {
    console.log('  ❌ Backend Dockerfile - Missing Gunicorn configuration');
    isValid = false;
  }
  
} catch (error) {
  console.log('  ❌ Error reading Dockerfiles:', error.message);
  isValid = false;
}

// Final validation result
console.log('\n' + '='.repeat(50));
if (isValid) {
  console.log('🎉 DEPLOYMENT VALIDATION PASSED!');
  console.log('✅ All required files and configurations are present');
  console.log('🚀 Ready for Render deployment');
  process.exit(0);
} else {
  console.log('❌ DEPLOYMENT VALIDATION FAILED!');
  console.log('💡 Please fix the missing files/configurations above');
  console.log('📚 See DEPLOYMENT_GUIDE.md for detailed instructions');
  process.exit(1);
} 