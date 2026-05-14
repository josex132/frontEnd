package TrabajoAPI.model;

public class Usuario {

    private Long id;
    private String nombre;
    private String email;
    private String password;
    private String rol; // <-- La nueva variable
    private boolean activo;

    // Constructor vacío
    public Usuario() {}

    // Constructor con parámetros (ahora incluye el rol)
    public Usuario(Long id, String nombre, String email, String password, String rol, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.rol = rol;
        this.activo = activo;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    // Getter y Setter para el Rol
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    
}