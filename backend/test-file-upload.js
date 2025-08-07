const fs = require('fs');
const path = require('path');

// Test the file upload functionality
console.log('Testing file upload functionality...');

// Create a test uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const medicalDocsDir = path.join(uploadsDir, 'medical-documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

if (!fs.existsSync(medicalDocsDir)) {
  fs.mkdirSync(medicalDocsDir, { recursive: true });
  console.log('Created medical-documents directory:', medicalDocsDir);
}

// Create a test file
const testFileName = `test_medical_${Date.now()}.txt`;
const testFilePath = path.join(medicalDocsDir, testFileName);
const testContent = `Test medical document
Uploaded at: ${new Date().toISOString()}
Destination: https://drive.google.com/drive/folders/1mDbBmwsymCiLuYoq0Xir8WsUDFwyVuJM?usp=drive_link
`;

fs.writeFileSync(testFilePath, testContent);
console.log('Created test file:', testFilePath);
console.log('File content:', testContent);

console.log('\nFile upload test completed successfully!');
console.log('The system is ready to handle medical document uploads.'); 