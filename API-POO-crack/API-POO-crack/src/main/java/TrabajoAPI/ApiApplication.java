package TrabajoAPI;

import TrabajoAPI.model.Producto;
import TrabajoAPI.repository.Productorepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(Productorepository repository) {
        return args -> {
            Producto p1 = new Producto();
            p1.setNombre("raquetas");
            p1.setPrecio(59.9);
            p1.setStock(10);
            p1.setDisponible(true);
            // Cambiamos "tenis" por "Categoria|Marca" (por ejemplo: tenis|Wilson)
            p1.setDescripcion("tenis|Wilson");

            Producto p2 = new Producto();
            p2.setNombre("balon de futbol");
            p2.setPrecio(30.0);
            p2.setStock(50);
            p2.setDisponible(true);
            // Cambiamos "futbol" por "Categoria|Marca" (por ejemplo: futbol|Adidas)
            p2.setDescripcion("futbol|Adidas");

            repository.guardar(p1);
            repository.guardar(p2);
        };
    }
}
