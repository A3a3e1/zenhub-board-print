const axios = require('axios');

const OWNER = 'elasticio';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = '<<<<<<<<<<<<<<<<INSERT_ONE_HERE>>>>>>>>>>>>>>>>';

const reposList = [
  'amazon-mws-component',
  'appdirect-component',
  'apttus-component',
  'aws-s3-component',
  'batch-component',
  'bloomberg-api-component',
  'code-component',
  'configuration-component',
  'csv-component',
  'docusign-component',
  'email-component',
  'exact-online-component',
  'filter-component',
  'google-translate-component',
  'gspreadsheets',
  'jdbc-component',
  'magento-component',
  'magento2-component',
  'mssql-component',
  'netsuite-component',
  'odata-component',
  'petstore-component-java',
  'petstore-component-nodejs',
  'postgresql-component',
  'quickbooks-component',
  'request-reply-component',
  'rest-api-component',
  'router-component',
  's2-component',
  'salesforce-component',
  'salesforce-cpq-component',
  'sap-ecc-r3-erp-component',
  'sapbydesign-component',
  'sapbydesign-component-old',
  'sftp-component',
  'shopify-admin-component',
  'shopware-component',
  'splitter-component',
  'sugarcrm-component',
  'utility-component',
  'batching-libary',
  'appdirect-subscription-events',
  'component-commons-library',
  'component-pusher',
  'projects',
  'sailor-jvm',
  'telekom-custom-development'
];


const labelData = {
  name: 'qa needed',
  description: 'Tasks that are implemented but not tested',
  color: 'f29513'
};

const requestGithub = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    'Authorization': `bearer ${GITHUB_TOKEN}`,
  },
});

async function createLabel() {
  for (let i = 0; i < reposList.length; i++) {
    const result = await requestGithub.post(`/repos/${OWNER}/${reposList[i]}/labels`, labelData)
    .then(response => {
      console.log(`${i}. ${reposList[i]} success`)
    })
    .catch(error => {
      console.log(`${i++}. ${reposList[i]} failure`)
    })
  }
};

createLabel();
