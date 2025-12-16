const DEFAULT_SORT = '-createdAt';

function cloneDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime());
}

function normalizeMessage(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (err) {
    return String(value);
  }
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toOptionalString(value) {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
}

function clonePledge(record) {
  if (!record) return null;
  return {
    ...record,
    date: cloneDate(record.date),
    createdAt: cloneDate(record.createdAt),
    updatedAt: cloneDate(record.updatedAt),
    deletedAt: cloneDate(record.deletedAt),
  };
}

function matchesSearchTerm(record, lowerTerm) {
  return ['title', 'donorName', 'message'].some((field) => {
    const value = record[field];
    return typeof value === 'string' && value.toLowerCase().includes(lowerTerm);
  });
}

function isWithinRange(record, start, end) {
  if (!start && !end) return true;
  const dateValue = cloneDate(record.date || record.createdAt);
  if (!dateValue) return false;
  if (start && dateValue < start) return false;
  if (end && dateValue > end) return false;
  return true;
}

class Query {
  constructor(items = []) {
    this.items = [...items];
    this._skip = 0;
    this._limit = Infinity;
    this._lean = false;
  }

  sort(spec) {
    if (!spec) return this;
    const field = spec.startsWith('-') ? spec.slice(1) : spec;
    const dir = spec.startsWith('-') ? -1 : 1;
    this.items.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return this;
  }

  skip(n) {
    const value = Number(n);
    this._skip = Number.isFinite(value) && value >= 0 ? value : 0;
    return this;
  }

  limit(n) {
    const value = Number(n);
    this._limit = Number.isFinite(value) && value >= 0 ? value : Infinity;
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  exec() {
    const start = this._skip;
    const end = this._limit === Infinity ? undefined : start + this._limit;
    const slice = this.items.slice(start, end);
    if (this._lean) {
      return Promise.resolve(slice.map((item) => clonePledge(item)));
    }
    return Promise.resolve(slice.map((item) => new Pledge(item)));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

class Pledge {
  static data = [];

  static lastGeneratedId = 0;

  constructor(data = {}) {
    const now = new Date();
    this.id = data.id != null ? data.id : undefined;
    this.campaign_id = data.campaign_id != null ? data.campaign_id : null;
    this.title = toOptionalString(data.title) || '';
    this.amount = toNumber(data.amount, 0);
    this.donorName = toOptionalString(data.donorName) || toOptionalString(data.name) || 'Anonymous';
    this.message = normalizeMessage(data.message);
    this.date = cloneDate(data.date) || cloneDate(data.pledgeDate) || now;
    this.createdBy = toOptionalString(data.createdBy) || toOptionalString(data.userId) || null;
    this.userId = toOptionalString(data.userId) || toOptionalString(data.createdBy) || null;
    this.status = toOptionalString(data.status) || 'active';
    this.createdAt = cloneDate(data.createdAt) || cloneDate(data.date) || now;
    this.updatedAt = cloneDate(data.updatedAt) || this.createdAt;
    this.deletedAt = cloneDate(data.deletedAt);
  }

  static _generateId() {
    const candidate = Date.now();
    if (candidate <= this.lastGeneratedId) {
      this.lastGeneratedId += 1;
      return this.lastGeneratedId;
    }
    this.lastGeneratedId = candidate;
    return candidate;
  }

  static _toStored(source) {
    return {
      id: source.id,
      campaign_id: source.campaign_id != null ? source.campaign_id : null,
      title: toOptionalString(source.title) || '',
      amount: toNumber(source.amount, 0),
      donorName: toOptionalString(source.donorName) || 'Anonymous',
      message: normalizeMessage(source.message),
      date: cloneDate(source.date) || cloneDate(source.createdAt) || new Date(),
      createdBy: toOptionalString(source.createdBy) || null,
      userId: toOptionalString(source.userId) || toOptionalString(source.createdBy) || null,
      status: toOptionalString(source.status) || 'active',
      createdAt: cloneDate(source.createdAt) || new Date(),
      updatedAt: cloneDate(source.updatedAt) || new Date(),
      deletedAt: cloneDate(source.deletedAt),
    };
  }

  static _clone(record) {
    return clonePledge(record);
  }

  save() {
    if (!this.id) {
      this.id = Pledge._generateId();
      if (!this.createdAt) {
        this.createdAt = cloneDate(this.date) || new Date();
      }
    }
    if (!this.date) {
      this.date = this.createdAt ? cloneDate(this.createdAt) : new Date();
    }
    this.updatedAt = new Date();
    const stored = Pledge._toStored(this);
    const idx = Pledge.data.findIndex((item) => String(item.id) === String(stored.id));
    if (idx === -1) {
      Pledge.data.push(stored);
    } else {
      Pledge.data[idx] = stored;
    }
    return Promise.resolve(Pledge._clone(stored));
  }

  static create(data) {
    const pledge = new Pledge(data);
    return pledge.save();
  }

  static find(query = {}) {
    const includeDeleted = Boolean(query.includeDeleted);
    const userId = toOptionalString(query.userId);
    const createdBy = toOptionalString(query.createdBy);
    const donor = toOptionalString(query.donorName);
    const status = toOptionalString(query.status);
    const search = toOptionalString(query.search);
    const start = cloneDate(query.fromDate || query.minDate || query.after || query.startDate);
    const end = cloneDate(query.toDate || query.maxDate || query.before || query.endDate);

    let items = this.data.filter((item) => includeDeleted || !item.deletedAt);

    if (userId) {
      items = items.filter((item) => String(item.userId || item.createdBy || '') === userId);
    }

    if (createdBy) {
      items = items.filter((item) => String(item.createdBy || item.userId || '') === createdBy);
    }

    if (donor) {
      const lower = donor.toLowerCase();
      items = items.filter((item) => typeof item.donorName === 'string' && item.donorName.toLowerCase().includes(lower));
    }

    if (status) {
      const statusLower = status.toLowerCase();
      items = items.filter((item) => (item.status || '').toLowerCase() === statusLower);
    }

    if (search) {
      const lower = search.toLowerCase();
      items = items.filter((record) => matchesSearchTerm(record, lower));
    }

    if (start || end) {
      items = items.filter((record) => isWithinRange(record, start, end));
    }

    return new Query(items);
  }

  static list(filter = {}) {
    const query = this.find(filter);
    const sortSpec = filter.sort || filter.order || DEFAULT_SORT;
    if (sortSpec) {
      query.sort(sortSpec);
    }
    const skipValue = filter.skip != null ? filter.skip : filter.offset;
    if (skipValue != null) {
      query.skip(skipValue);
    }
    if (filter.limit != null) {
      query.limit(filter.limit);
    }
    return query.exec();
  }

  static findById(id, options = {}) {
    if (id == null) return Promise.resolve(null);
    const includeDeleted = Boolean(options.includeDeleted || options.withDeleted);
    const match = this.data.find((item) => String(item.id) === String(id));
    if (!match) return Promise.resolve(null);
    if (!includeDeleted && match.deletedAt) return Promise.resolve(null);
    return Promise.resolve(this._clone(match));
  }

  static countDocuments(query = {}) {
    return this.find(query).lean().exec().then((results) => results.length);
  }

  static update(id, changes = {}) {
    if (id == null) return Promise.resolve({ affectedRows: 0 });
    const index = this.data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return Promise.resolve({ affectedRows: 0 });
    const current = this.data[index];
    if (current.deletedAt) return Promise.resolve({ affectedRows: 0 });

    const updated = { ...current };
    let mutated = false;

    if (changes.title !== undefined) {
      const title = toOptionalString(changes.title);
      if (title) {
        updated.title = title;
        mutated = true;
      }
    }

    if (changes.amount !== undefined) {
      const amount = toNumber(changes.amount, NaN);
      if (!Number.isNaN(amount)) {
        updated.amount = amount;
        mutated = true;
      }
    }

    if (changes.donorName !== undefined) {
      const donorName = toOptionalString(changes.donorName);
      if (donorName) {
        updated.donorName = donorName;
        mutated = true;
      }
    }

    if (changes.message !== undefined) {
      updated.message = normalizeMessage(changes.message);
      mutated = true;
    }

    if (changes.date !== undefined) {
      const parsedDate = cloneDate(changes.date);
      if (parsedDate) {
        updated.date = parsedDate;
        mutated = true;
      }
    }

    if (changes.status !== undefined) {
      const status = toOptionalString(changes.status);
      if (status) {
        updated.status = status;
        mutated = true;
      }
    }

    if (changes.createdBy !== undefined) {
      updated.createdBy = toOptionalString(changes.createdBy);
      mutated = true;
    }

    if (changes.userId !== undefined) {
      updated.userId = toOptionalString(changes.userId);
      mutated = true;
    }

    if (!mutated) return Promise.resolve({ affectedRows: 0 });

    updated.updatedAt = new Date();
    this.data[index] = Pledge._toStored(updated);
    return Promise.resolve({ affectedRows: 1, pledge: this._clone(this.data[index]) });
  }

  static softDelete(id) {
    if (id == null) return Promise.resolve({ affectedRows: 0 });
    const index = this.data.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return Promise.resolve({ affectedRows: 0 });
    const next = Pledge._toStored({ ...this.data[index], deletedAt: new Date(), updatedAt: new Date() });
    if (this.data[index].deletedAt) return Promise.resolve({ affectedRows: 0 });
    this.data[index] = next;
    return Promise.resolve({ affectedRows: 1 });
  }
}

module.exports = Pledge;
