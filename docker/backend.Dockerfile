FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
RUN mvn --batch-mode --no-transfer-progress -pl backend -am -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S invenlio && adduser -S -G invenlio invenlio
WORKDIR /app
COPY --from=build --chown=invenlio:invenlio /workspace/backend/target/invenlio-backend-*.jar app.jar
USER invenlio
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
