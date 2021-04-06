package au.com.agiledigital.jasminerhino;

public class ResultListener {
    public void done(Boolean passed) {
        System.exit(passed ? 0 : 1);
    }
}
