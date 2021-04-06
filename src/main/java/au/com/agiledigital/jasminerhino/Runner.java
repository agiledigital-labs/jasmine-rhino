package au.com.agiledigital.jasminerhino;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;

import org.apache.commons.lang3.ArrayUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.SoftCachingModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider;

import java.io.File;
import java.io.Reader;
import java.io.FileReader;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class Runner {


    /**
     * Array of directories where script modules are located.
     * Must start and end with /
     *
     * Add additional paths for the location of modules to test, or the test modules themselves.
     */
    private static final String[] moduleContainers = new String[] {
        "/",
        "/bin/defaults/script/",
        "/scriptLibs/"
    };

    private static List<File> getTestFiles(File cursor) {
        if(cursor.isDirectory()) {
            File[] files = Optional.ofNullable(cursor.listFiles()).orElse(ArrayUtils.toArray());
            return Arrays.stream(files)
                    .flatMap(file -> getTestFiles(file).stream())
                    .collect(Collectors.toList());
        } else if(cursor.getName().endsWith(".test.js") || cursor.getName().endsWith(".spec.js")) {
            return Collections.singletonList(cursor);
        }

        return Collections.emptyList();
    }

    public static void main(String[] args) throws Exception {
        File testDir = new File(args[0]);

        List<URI> sourceUris = Arrays.stream(args)
                .skip(1)
                .map(path -> (new File(path)).toURI())
                .collect(Collectors.toList());

        List<String> preScripts = Arrays.asList(
            "/js/predef.js",
            "/js/jasmine-2.9.1/jasmine.js",
            "/js/jasmine-2.9.1/console.js",
            "/js/boot.js"
        );

        RequireBuilder requireBuilder = new RequireBuilder();
        requireBuilder.setModuleScriptProvider(new SoftCachingModuleScriptProvider(new UrlModuleSourceProvider(sourceUris, null)));


        Context context = Context.enter();
        Scriptable scope = context.initStandardObjects();
        requireBuilder.createRequire(context, scope).install(scope);

        for(String resource: preScripts) {
            InputStream stream = Runner.class.getResourceAsStream(resource);
            context.evaluateReader(scope, new InputStreamReader(stream), resource, 1, null);
        }

        List<File> testFiles = getTestFiles(testDir);
        for(File testFile: testFiles) {
            Reader fileReader = new FileReader(testFile);
            context.evaluateReader(scope, fileReader, testFile.getName(), 1, null);
        }

        InputStream runnerStream = Runner.class.getResourceAsStream("/js/runner.js");
        context.evaluateReader(scope, new InputStreamReader(runnerStream), "runner.js", 1, null);

        Function execute = (Function) scope.get("executeTests", scope);
        execute.call(context, scope, scope, new Object[] { new ResultListener()});
    }
}

