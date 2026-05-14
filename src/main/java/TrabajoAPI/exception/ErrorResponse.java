package TrabajoAPI.exception;

import java.util.List;

public class ErrorResponse {

    private int status;
    private String mensaje;
    private List<String> errores;

    public ErrorResponse(int status, String mensaje) {
        this.status = status;
        this.mensaje = mensaje;
    }

    public ErrorResponse(int status, String mensaje, List<String> errores) {
        this.status = status;
        this.mensaje = mensaje;
        this.errores = errores;
    }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public List<String> getErrores() { return errores; }
    public void setErrores(List<String> errores) { this.errores = errores; }
}
