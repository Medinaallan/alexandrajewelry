import { useCallback, useEffect, useState } from 'react';
import { Plus, KeyRound, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../contexts/AdminContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import type { AdminUser } from '../../types';

const MIN_PASSWORD = 8;

/** Id of the signed-in user, read from the session token. */
function sessionUserId(token: string | null): number | null {
  try {
    const payload = token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { sub } = JSON.parse(atob(payload)) as { sub?: string };
    return sub ? Number(sub) : null;
  } catch {
    return null;
  }
}

type FieldDef = { name: string; label: string; type: 'text' | 'email' | 'password'; value?: string; autocomplete: AutoFill };

/** Builds the form inside a SweetAlert with DOM nodes (no HTML strings, so names can't inject markup). */
function buildForm(fields: FieldDef[]): HTMLElement {
  const form = document.createElement('div');
  form.style.cssText = 'display:flex;flex-direction:column;gap:12px;text-align:left';
  for (const f of fields) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:0.75rem;color:var(--text-muted)';
    label.textContent = f.label;
    const input = document.createElement('input');
    input.className = 'form-input';
    input.name = f.name;
    input.type = f.type;
    input.autocomplete = f.autocomplete;
    input.value = f.value ?? '';
    label.appendChild(input);
    form.appendChild(label);
  }
  return form;
}

function readForm(): Record<string, string> {
  const values: Record<string, string> = {};
  Swal.getHtmlContainer()?.querySelectorAll('input').forEach((input) => {
    values[input.name] = input.value.trim();
  });
  return values;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminUsersPage() {
  const { token } = useAdmin();
  const me = sessionUserId(token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setUsers(await api.admin.users.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const done = async (message: string) => {
    await load();
    void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: message, showConfirmButton: false, timer: 2500 });
  };

  /** Runs an API call from a dialog: on error the dialog stays open and shows it. */
  const attempt = async (action: () => Promise<unknown>) => {
    try {
      await action();
      return true;
    } catch (err) {
      Swal.showValidationMessage(err instanceof Error ? err.message : 'No se pudo guardar.');
      return false;
    }
  };

  const createUser = async () => {
    if (!token) return;
    const result = await Swal.fire({
      title: 'Nuevo usuario',
      html: buildForm([
        { name: 'username', label: 'Usuario', type: 'text', autocomplete: 'off' },
        { name: 'email', label: 'Correo', type: 'email', autocomplete: 'off' },
        { name: 'password', label: `Contraseña (mínimo ${MIN_PASSWORD} caracteres)`, type: 'password', autocomplete: 'new-password' },
      ]),
      showCancelButton: true,
      confirmButtonText: 'Crear usuario',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const v = readForm();
        if (!v.username) return Swal.showValidationMessage('Escribe un nombre de usuario.');
        if (!EMAIL_RE.test(v.email)) return Swal.showValidationMessage('Escribe un correo válido.');
        if (v.password.length < MIN_PASSWORD) return Swal.showValidationMessage(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
        return attempt(() => api.admin.users.create(token, { username: v.username, email: v.email, password: v.password }));
      },
    });
    if (result.isConfirmed && result.value) await done('Usuario creado');
  };

  const editUser = async (user: AdminUser) => {
    if (!token) return;
    const result = await Swal.fire({
      title: `Editar ${user.username}`,
      html: buildForm([
        { name: 'username', label: 'Usuario', type: 'text', value: user.username, autocomplete: 'off' },
        { name: 'email', label: 'Correo', type: 'email', value: user.email, autocomplete: 'off' },
      ]),
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const v = readForm();
        if (!v.username) return Swal.showValidationMessage('Escribe un nombre de usuario.');
        if (!EMAIL_RE.test(v.email)) return Swal.showValidationMessage('Escribe un correo válido.');
        return attempt(() => api.admin.users.update(token, user.id, { username: v.username, email: v.email }));
      },
    });
    if (result.isConfirmed && result.value) await done('Usuario actualizado');
  };

  const changePassword = async (user: AdminUser) => {
    if (!token) return;
    const result = await Swal.fire({
      title: user.id === me ? 'Cambiar mi contraseña' : `Nueva contraseña para ${user.username}`,
      html: buildForm([
        { name: 'password', label: `Nueva contraseña (mínimo ${MIN_PASSWORD} caracteres)`, type: 'password', autocomplete: 'new-password' },
        { name: 'confirm', label: 'Repite la contraseña', type: 'password', autocomplete: 'new-password' },
      ]),
      showCancelButton: true,
      confirmButtonText: 'Cambiar contraseña',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const v = readForm();
        if (v.password.length < MIN_PASSWORD) return Swal.showValidationMessage(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
        if (v.password !== v.confirm) return Swal.showValidationMessage('Las contraseñas no coinciden.');
        return attempt(() => api.admin.users.changePassword(token, user.id, v.password));
      },
    });
    if (result.isConfirmed && result.value) await done('Contraseña cambiada');
  };

  const toggleUser = async (user: AdminUser) => {
    if (!token) return;
    if (user.active) {
      const answer = await Swal.fire({
        title: `¿Desactivar a ${user.username}?`,
        text: 'Ya no podrá iniciar sesión en el panel.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
      });
      if (!answer.isConfirmed) return;
    }
    try {
      await api.admin.users.toggle(token, user.id);
      await done(user.active ? 'Usuario desactivado' : 'Usuario activado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el usuario.');
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!token) return;
    const answer = await Swal.fire({
      title: `¿Eliminar a ${user.username}?`,
      text: 'Esta acción no se puede deshacer. Si solo quieres quitarle el acceso, desactívalo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (!answer.isConfirmed) return;
    try {
      await api.admin.users.delete(token, user.id);
      await done('Usuario eliminado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.');
    }
  };

  const iconButton = 'p-1.5 transition-colors text-(--text-muted) disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>Usuarios</h1>
          <Button variant="gold" size="sm" onClick={() => void createUser()}>
            <Plus size={14} /> Nuevo usuario
          </Button>
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{error}</p>}

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {loading ? (
            <p className="p-6" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    {['Usuario', 'Correo', 'Estado', 'Creado', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u.id === me;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--text)', fontWeight: 500 }}>
                          {u.username}
                          {isMe && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--gold)' }}>(tú)</span>}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleUser(u)}
                            disabled={isMe}
                            title={isMe ? 'No puedes desactivar tu propio usuario' : u.active ? 'Desactivar' : 'Activar'}
                            className="flex items-center gap-1.5 hover:text-(--gold) transition-colors text-(--text-muted) disabled:cursor-not-allowed"
                          >
                            {u.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                            <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{u.active ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(u.createdAt).toLocaleDateString('es-US')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => void editUser(u)} className={`${iconButton} hover:text-(--gold)`} title="Editar" aria-label={`Editar ${u.username}`}>
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => void changePassword(u)} className={`${iconButton} hover:text-(--gold)`} title="Cambiar contraseña" aria-label={`Cambiar contraseña de ${u.username}`}>
                              <KeyRound size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteUser(u)}
                              disabled={isMe}
                              className={`${iconButton} hover:text-red-500`}
                              title={isMe ? 'No puedes eliminar tu propio usuario' : 'Eliminar'}
                              aria-label={`Eliminar ${u.username}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Todos los usuarios son administradores: tienen acceso completo al panel. Al cambiar la contraseña de un usuario o
          desactivarlo, se cierran todas sus sesiones abiertas (si es tu propio usuario, tendrás que volver a entrar).
        </p>
      </div>
    </div>
  );
}
