package io.invenlio;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "io.invenlio")
class ArchitectureTest {
    @ArchTest
    static final ArchRule NO_CROSS_MODULE_INTERNAL_ACCESS = noClasses()
            .that().resideOutsideOfPackage("io.invenlio.shared..")
            .should().dependOnClassesThat().resideInAnyPackage("io.invenlio.shared..web..", "io.invenlio.shared..security..");

    @Test
    void modulithBoundariesAreValid() {
        ApplicationModules.of(InvenlioApplication.class).verify();
    }
}

