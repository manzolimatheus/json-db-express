const fs = require('fs');
const databaseFile = './database.json';
const databaseDir = './database';

function startEngine() {
  if (!fs.existsSync(databaseFile)) {
    return {};
  }

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir);
  }

  const tables = JSON.parse(fs.readFileSync(databaseFile, 'utf-8'));

  tables.forEach((table) => {
    const tableName = Object.keys(table)[0];
    const tableFileExists = fs.existsSync(`./database/${tableName}.json`);
    if (!tableFileExists) {
      fs.writeFileSync(`./database/${tableName}.json`, JSON.stringify([]));
    }
  });
}

class Table {
  constructor(name) {
    this.name = name;
    this.filePath = `./database/${name}.json`;
  }

  getSchema() {
    if (!fs.existsSync(databaseFile)) {
      return {};
    }

    const tables = JSON.parse(fs.readFileSync(databaseFile, 'utf-8'));
    const table = tables.find((t) => Object.keys(t)[0] === this.name);
    console.log('Schema for table:', this.name, table ? table[this.name] : []);
    return table ? table[this.name] : [];
  }

  validateSchema(record) {
    const schema = this.getSchema();

    schema.forEach((field) => {
      console.log(field);
      if (field.unique) {
        const alreadyExists =
          this.searchByField(field.field, record[field.field]).length > 0;

        if (alreadyExists) {
          throw new Error(
            `Field "${field.field}" must be unique. Value "${record[field.field]}" already exists.`,
          );
        }
      }

      if (field.required && !record.hasOwnProperty(field.field)) {
        throw new Error(`Field "${field.field}" is required.`);
      }

      if (
        record.hasOwnProperty(field.field) &&
        typeof record[field.field] !== field.type
      ) {
        throw new Error(
          `Field "${field.field}" must be of type ${field.type}.`,
        );
      }
    });
  }

  buildRecordAccordingToSchema(record) {
    const recordAccordingToSchema = {};

    this.getSchema().forEach((field) => {
      recordAccordingToSchema[field.field] = record[field.field];
    });

    return recordAccordingToSchema;
  }

  insert(record) {

    this.validateSchema(record);

    const recordAccordingToSchema = this.buildRecordAccordingToSchema(record);
    recordAccordingToSchema.id = Date.now();

    const records = this.getAll();
    records.push(recordAccordingToSchema);
    fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2));
  
    return recordAccordingToSchema;
  }

  getAll() {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
  }

  findById(id) {
    const records = this.getAll();
    return records.find((record) => record.id === id);
  }

  searchByField(fieldName, value) {
    const records = this.getAll();
    return records.filter((record) => record[fieldName] === value);
  }

  deleteById(id) {
    const records = this.getAll();
    const updatedRecords = records.filter((record) => record.id !== id);
    fs.writeFileSync(this.filePath, JSON.stringify(updatedRecords, null, 2));
  }

  updateById(id, updatedRecord) {
    const records = this.getAll();
    const index = records.findIndex((record) => record.id === id);

    if (index !== -1) {
      const recordAccordingToSchema = this.buildRecordAccordingToSchema({
        ...records[index],
        ...updatedRecord,
      });
      recordAccordingToSchema.id = records[index].id;
      records[index] = recordAccordingToSchema;
      fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2));
    }
  }
}

module.exports = {
  startEngine,
  Table,
};
