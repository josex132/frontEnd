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
    private long contadorId = 1;

    public Usuario guardar(Usuario usuario) {
        if (usuario.getId() == null) {
            usuario.setId(contadorId);
            contadorId++;
        }
        usuarios.put(usuario.getId(), usuario);
        return usuario;
    }

    public Usuario buscarPorId(Long id) {
        return usuarios.get(id);
    }

    public List<Usuario> buscarTodos() {
        List<Usuario> lista = new ArrayList<>();
        for (Usuario u : usuarios.values()) {
            lista.add(u);
        }
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
