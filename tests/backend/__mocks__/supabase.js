import { jest } from "@jest/globals";

let tables = {
  events: [],
  event_attendees: [],
  profiles: [],
  notifications: [],
};

let idCounters = {};
let defaultAuthUser = { id: "test-user" };

const clone = (value) => JSON.parse(JSON.stringify(value));

const resetState = () => {
  tables = {
    events: [],
    event_attendees: [],
    profiles: [],
    notifications: [],
  };
  idCounters = {};
  defaultAuthUser = { id: "test-user" };
};

const nextId = (table) => {
  idCounters[table] = (idCounters[table] || 0) + 1;
  return idCounters[table];
};

const applyFilters = (rows, filters = []) =>
  rows.filter((row) =>
    filters.every(({ column, value, op }) => {
      const left = String(row[column]);
      const right = String(value);

      if (op === "neq") {
        return left !== right;
      }

      return left === right;
    })
  );

const applyOrdering = (rows, ordering) => {
  if (!ordering) return rows;
  const { column, ascending = true } = ordering;
  return [...rows].sort((a, b) => {
    if (a[column] === b[column]) return 0;
    return ascending
      ? a[column] > b[column]
        ? 1
        : -1
      : a[column] < b[column]
      ? 1
      : -1;
  });
};

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.action = null;
    this.payload = null;
    this.filters = [];
    this.ordering = null;
    this.singleRow = false;
    this.returning = null;
    this.columns = "*";
  }

  select(columns = "*") {
    if (!this.action) {
      this.action = "select";
      this.columns = columns;
      return this;
    }
    this.returning = columns;
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value, op: "eq" });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, value, op: "neq" });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.ordering = { column, ascending };
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  async _execute() {
    const rows = tables[this.table] || [];
    const filtered = applyFilters(rows, this.filters);

    if (this.action === "select") {
      let ordered = applyOrdering(filtered, this.ordering);

      // Basic support for the profiles used in getEventAttendees
      if (
        this.table === "event_attendees" &&
        typeof this.columns === "string" &&
        this.columns.includes("profiles!inner")
      ) {
        ordered = ordered
          .map((row) => {
            const profile = tables.profiles.find(
              (p) => String(p.id) === String(row.user_id)
            );
            if (!profile) return null; // inner join drops rows without profile
            return { ...row, profiles: { ...profile } };
          })
          .filter(Boolean);
      }

      const data = this.singleRow ? ordered[0] || null : ordered;
      return {
        data,
        error: this.singleRow && !data ? new Error("No rows") : null,
      };
    }

    if (this.action === "insert") {
      const payloadArray = Array.isArray(this.payload)
        ? this.payload
        : [this.payload];
      const inserted = payloadArray.map((row) => ({
        id: row.id ?? nextId(this.table),
        ...clone(row),
      }));
      tables[this.table] = [...rows, ...inserted];
      return { data: inserted, error: null };
    }

    if (this.action === "update") {
      const updated = [];
      tables[this.table] = rows.map((row) => {
        const match = this.filters.every(
          ({ column, value }) => String(row[column]) === String(value)
        );
        if (!match) return row;
        const merged = { ...row, ...this.payload };
        updated.push(merged);
        return merged;
      });

      const data = this.singleRow
        ? this.returning
          ? updated[0] || null
          : null
        : this.returning
        ? updated
        : null;
      const error = this.singleRow && !data ? new Error("No rows") : null;
      return { data, error };
    }

    if (this.action === "delete") {
      const remaining = [];
      const removed = [];
      for (const row of rows) {
        const match = this.filters.every(
          ({ column, value }) => String(row[column]) === String(value)
        );
        if (match) removed.push(row);
        else remaining.push(row);
      }
      tables[this.table] = remaining;
      const data = this.returning ? removed : null;
      return { data, error: null };
    }

    return { data: null, error: new Error("No action specified") };
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }
}

const supabase = {
  auth: {
    getUser: jest.fn(async (token) => {
      if (!token) {
        return { data: { user: null }, error: new Error("No token") };
      }
      return { data: { user: defaultAuthUser }, error: null };
    }),
  },
  from: jest.fn((table) => new QueryBuilder(table)),
  __reset: () => resetState(),
  __setTable: (table, data) => {
    tables[table] = clone(data);
  },
  __getTable: (table) => clone(tables[table] || []),
  __setAuthUser: (user) => {
    defaultAuthUser = user;
  },
};

export default supabase;
