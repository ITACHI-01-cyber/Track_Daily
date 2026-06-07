# Build Stage
FROM maven:3.9.9-eclipse-temurin-25-noble AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY --from=build /app/target/habit-track-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "app.jar"]
