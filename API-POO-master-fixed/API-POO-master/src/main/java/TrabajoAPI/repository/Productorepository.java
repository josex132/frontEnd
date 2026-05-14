package TrabajoAPI.repository;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import TrabajoAPI.model.Producto;
@Repository
public class Productorepository {

    private Map<Long, Producto> productos = new HashMap<>();

    /**
     * Calcula el próximo ID disponible desde 1.
     * Si existen [1,2,4] devuelve 3.
     * Si existen [1,2,3] devuelve 4.
     * Si está vacío       devuelve 1.
     */
    private long siguienteId() {
        long id = 1;
        while (productos.containsKey(id)) {
            id++;
        }
        return id;
    }

    public Producto guardar(Producto producto) {
        if (producto.getId() == null) {
            producto.setId(siguienteId());
        }
        productos.put(producto.getId(), producto);
        return producto;
    }

    public Producto buscarPorId(Long id) {
        return productos.get(id);
    }

    public List<Producto> buscarTodos() {
        List<Producto> lista = new ArrayList<>(productos.values());
        lista.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return lista;
    }

    public boolean eliminar(Long id) {
        if (productos.containsKey(id)) {
            productos.remove(id);
            return true;
        }
        return false;
    }

    public boolean existeNombre(String nombre) {
        for (Producto p : productos.values()) {
            if (p.getNombre().equals(nombre)) {
                return true;
            }
        }
        return false;
    }

    public boolean existeNombreEnOtroProducto(String nombre, Long idActual) {
        for (Producto p : productos.values()) {
            if (p.getNombre().equals(nombre) && !p.getId().equals(idActual)) {
                return true;
            }
        }
        return false;
    }
}
