const crypto = require("crypto");

const users = [];
const debugSessions = [];

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

function matchesFilter(item, filter) {
  return Object.entries(filter).every(([key, value]) => String(item[key]) === String(value));
}

function sortByDateDesc(items, key) {
  return [...items].sort((a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime());
}

function createMemoryModel(collection) {
  return class MemoryModel {
    constructor(data) {
      Object.assign(this, data);
      this._id = data._id || createId();
    }

    static async create(data) {
      const now = new Date();
      const record = new this({ ...data, createdAt: now, updatedAt: now });
      collection.push(record);
      return record;
    }

    static async findOne(filter) {
      return collection.find((item) => matchesFilter(item, filter)) || null;
    }

    static async findById(id) {
      return collection.find((item) => String(item._id) === String(id)) || null;
    }

    static find(filter) {
      let result = collection.filter((item) => matchesFilter(item, filter));
      return {
        sort(sortSpec) {
          const [key, direction] = Object.entries(sortSpec)[0] || ["updatedAt", -1];
          result = direction < 0 ? sortByDateDesc(result, key) : [...result].sort((a, b) => new Date(a[key]) - new Date(b[key]));
          return this;
        },
        limit(count) {
          result = result.slice(0, count);
          return this;
        },
        async then(resolve, reject) {
          return Promise.resolve(result).then(resolve, reject);
        },
      };
    }

    async save() {
      this.updatedAt = new Date();
      const index = collection.findIndex((item) => String(item._id) === String(this._id));
      if (index >= 0) collection[index] = this;
      else collection.push(this);
      return this;
    }
  };
}

module.exports = {
  MemoryUser: createMemoryModel(users),
  MemoryDebugSession: createMemoryModel(debugSessions),
};
