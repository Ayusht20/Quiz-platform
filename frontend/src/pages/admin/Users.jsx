import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Users as UsersIcon,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  getAdminUsers,
} from "../../services/adminManagementService";


export default function Users() {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadUsers();
  }, []);


  const loadUsers = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAdminUsers();

      setUsers(data);

    } catch (err) {

      console.error(
        "Failed to load users:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Failed to load users."
      );

    } finally {

      setLoading(false);

    }
  };


  const filteredUsers = useMemo(() => {

    const searchValue =
      search.trim().toLowerCase();

    return users.filter((user) => {

      const matchesSearch =
        !searchValue ||
        user.name
          ?.toLowerCase()
          .includes(searchValue) ||
        user.email
          ?.toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        filter === "ALL" ||
        user.role === filter ||
        user.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  }, [users, search, filter]);


  const students = users.filter(
    (user) =>
      user.role === "STUDENT"
  ).length;


  const activeUsers = users.filter(
    (user) =>
      user.status === "ACTIVE"
  ).length;


  const admins = users.filter(
    (user) =>
      user.role === "ADMIN"
  ).length;


  return (
    <div className="min-h-full bg-[var(--bg)]">

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HEADER */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Users
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            View and monitor SkillArena users.
          </p>

        </div>


        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <MiniStat
            icon={UsersIcon}
            label="Students"
            value={students}
          />

          <MiniStat
            icon={UserCheck}
            label="Active Users"
            value={activeUsers}
          />

          <MiniStat
            icon={Shield}
            label="Administrators"
            value={admins}
          />

        </div>


        {/* SEARCH */}

        <div className="mt-8 flex flex-col gap-3 md:flex-row">

          <div className="flex flex-1 items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">

            <Search
              size={17}
              className="text-[var(--muted)]"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or email..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />

          </div>


          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-bold outline-none"
          >

            <option value="ALL">
              All Users
            </option>

            <option value="STUDENT">
              Students
            </option>

            <option value="ADMIN">
              Administrators
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

          </select>

        </div>


        {/* TABLE */}

        <div className="mt-6 overflow-hidden border border-[var(--border)] bg-[var(--surface)]">

          {loading ? (

            <div className="p-10 text-center text-sm text-[var(--muted)]">
              Loading users...
            </div>

          ) : error ? (

            <div className="p-10 text-center">

              <p className="text-sm font-bold text-red-400">
                {error}
              </p>

              <button
                onClick={loadUsers}
                className="mt-4 bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
              >
                Retry
              </button>

            </div>

          ) : filteredUsers.length === 0 ? (

            <div className="p-10 text-center text-sm text-[var(--muted)]">
              No users found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead>

                  <tr className="border-b border-[var(--border)] text-left">

                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      User
                    </th>

                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Role
                    </th>

                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      XP
                    </th>

                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Level
                    </th>

                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="border-b border-[var(--border)] last:border-b-0"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">

                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}

                          </div>

                          <div>

                            <p className="text-sm font-black">
                              {user.name}
                            </p>

                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {user.email}
                            </p>

                          </div>

                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <span className="text-[10px] font-black uppercase text-[var(--primary)]">
                          {user.role}
                        </span>

                      </td>


                      <td className="px-5 py-4 text-sm font-black">
                        {user.xp ?? 0}
                      </td>


                      <td className="px-5 py-4 text-sm font-black">
                        {user.level ?? 1}
                      </td>


                      <td className="px-5 py-4">

                        {user.status === "ACTIVE" ? (

                          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-[var(--success)]">

                            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />

                            Active

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-red-400">

                            <span className="h-2 w-2 rounded-full bg-red-400" />

                            {user.status}

                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}


function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-5">

      <div className="flex h-9 w-9 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

    </div>
  );
}