package TrabajoAPI.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import TrabajoAPI.dto.UsuarioRequisitos;
import TrabajoAPI.dto.Usuarioresponse;
import TrabajoAPI.exception.Badrequestexception;
import TrabajoAPI.exception.Resourcenotfoundexception;
import TrabajoAPI.model.Usuario;
import TrabajoAPI.repository.Usuariorepository;

@Service
public class Usuarioservice {

    private Usuariorepository usuarioRepository;

    public Usuarioservice(Usuariorepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuarioresponse crear(UsuarioRequisitos request) {
        if (usuarioRepository.existeEmail(request.getEmail())) {
            throw new Badrequestexception("Ya existe un usuario con ese email");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(request.getPassword());
        usuario.setRol(request.getRol()); // <-- Guardamos el rol en la BD
        usuario.setActivo(true);

        usuarioRepository.guardar(usuario);

        return convertirAResponse(usuario);
    }

    public List<Usuarioresponse> obtenerTodos() {
        List<Usuario> usuarios = usuarioRepository.buscarTodos();
        List<Usuarioresponse> respuesta = new ArrayList<>();

        for (Usuario u : usuarios) {
            respuesta.add(convertirAResponse(u));
        }

        return respuesta;
    }

    public Usuarioresponse obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.buscarPorId(id);
        if (usuario == null) {
            throw new Resourcenotfoundexception("Usuario no encontrado");
        }
        return convertirAResponse(usuario);
    }

    public Usuarioresponse actualizar(Long id, UsuarioRequisitos request) {
        Usuario usuario = usuarioRepository.buscarPorId(id);
        if (usuario == null) {
            throw new Resourcenotfoundexception("Usuario no encontrado");
        }

        if (usuarioRepository.existeEmailEnOtroUsuario(request.getEmail(), id)) {
            throw new Badrequestexception("Ya existe un usuario con ese email");
        }

        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(request.getPassword());
        usuario.setRol(request.getRol()); // <-- Actualizamos el rol en la BD

        usuarioRepository.guardar(usuario);

        return convertirAResponse(usuario);
    }

    public void eliminar(Long id) {
        Usuario usuario = usuarioRepository.buscarPorId(id);
        if (usuario == null) {
            throw new Resourcenotfoundexception("Usuario no encontrado");
        }
        usuarioRepository.eliminar(id);
    }

    private Usuarioresponse convertirAResponse(Usuario usuario) {
        Usuarioresponse response = new Usuarioresponse();
        response.setId(usuario.getId());
        response.setNombre(usuario.getNombre());
        response.setEmail(usuario.getEmail());
        response.setRol(usuario.getRol()); // <-- Enviamos el rol al Frontend
        response.setActivo(usuario.isActivo());
        return response;
    }
}