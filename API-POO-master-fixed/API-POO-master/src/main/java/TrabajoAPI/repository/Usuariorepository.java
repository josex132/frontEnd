package TrabajoAPI.repository;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import TrabajoAPI.model.Usuario;
@Repository
public class Usuariorepository {

    private Map<Long, Usuario> usuarios = new HashMap<>();

    /**
     * Calcula el próximo ID disponible desde 1.
     * Si existen [1,2,4] devuelve 3.
     * Si existen [1,2,3] devuelve 4.
     * Si está vacío       devuelve 1.
     */
    private long siguienteId() {
        long id = 1;
        while (usuarios.containsKey(id)) {
            id++;
        }
        return id;
    }

    public Usuario guardar(Usuario usuario) {
        if (usuario.getId() == null) {
            usuario.setId(siguienteId());
        }
        usuarios.put(usuario.getId(), usuario);
        return usuario;
    }

    public Usuario buscarPorId(Long id) {
        return usuarios.get(id);
    }

    public List<Usuario> buscarTodos() {
        List<Usuario> lista = new ArrayList<>(usuarios.values());
        lista.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return lista;
    }

    public boolean eliminar(Long id) {
        if (usuarios.containsKey(id)) {
            usuarios.remove(id);
            return true;
        }
        return false;
    }

    public boolean existeEmail(String email) {
        for (Usuario u : usuarios.values()) {
            if (u.getEmail().equals(email)) {
                return true;
            }
        }
        return false;
    }

    public boolean existeEmailEnOtroUsuario(String email, Long idActual) {
        for (Usuario u : usuarios.values()) {
            if (u.getEmail().equals(email) && !u.getId().equals(idActual)) {
                return true;
            }
        }
        return false;
    }
}
