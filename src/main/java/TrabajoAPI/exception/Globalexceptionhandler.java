package TrabajoAPI.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class Globalexceptionhandler {


    @ExceptionHandler(Resourcenotfoundexception.class)
    public ResponseEntity<ErrorResponse> handleNotFound(Resourcenotfoundexception ex) {
        ErrorResponse error = new ErrorResponse(404, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(Badrequestexception.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(Badrequestexception ex) {
        ErrorResponse error = new ErrorResponse(400, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(MethodArgumentNotValidException ex) {
        List<String> errores = new ArrayList<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errores.add(fieldError.getDefaultMessage());
        }
        ErrorResponse error = new ErrorResponse(400, "Error en los datos enviados", errores);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
