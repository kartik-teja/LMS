const { sequelize } = require('./models'); 

async function deleteData() {
  try {
    await sequelize.sync({ force: true });

    console.log('All data deleted successfully.');
    process.exit(0); 
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1); 
  }
}

deleteData();
