-- MySQL dump 10.13  Distrib 8.0.11, for Win64 (x86_64)
--
-- Host: localhost    Database: weather
-- ------------------------------------------------------
-- Server version	8.0.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8mb4 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `stats`
--

DROP TABLE IF EXISTS `stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `stats` (
  `runTimeStamp` int(10) unsigned NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `countOfItems` int(10) unsigned DEFAULT NULL,
  `sumOfTempC` float DEFAULT NULL,
  `sumOfWindMps` float DEFAULT NULL,
  `sumOfPressureHPA` float DEFAULT NULL,
  `lastUpdateTimestamp` int(10) unsigned DEFAULT NULL,
  `sumOfTempCDiff` float DEFAULT NULL,
  `tempDiffCount` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`sourceApi`,`runTimeStamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stats`
--

LOCK TABLES `stats` WRITE;
/*!40000 ALTER TABLE `stats` DISABLE KEYS */;
INSERT INTO `stats` VALUES (1539950400,'hi',0,0,0,0,0,0,0),(1539795600,'iceland',10,45,62,NULL,1539791411,0,0),(1539846000,'iceland',10,70,55,NULL,1539791411,0,0),(1539853200,'iceland',10,70,55,NULL,1539791411,0,0),(1539864000,'iceland',10,70,55,NULL,1539791411,0,0),(1539874800,'iceland',10,70,55,NULL,1539791411,0,0),(1539878400,'iceland',10,70,55,NULL,1539791411,0,0),(1539885600,'iceland',10,70,55,NULL,1539791411,0,0),(1539889200,'iceland',10,70,55,NULL,1539791411,0,0),(1539928800,'iceland',10,63,68,NULL,1539791411,0,0),(1539943200,'iceland',10,63,68,NULL,1539791411,0,0),(1539950400,'iceland',10,63,68,NULL,1539791411,0,0),(1539950400,'metno',0,0,0,0,0,0,0),(1539795600,'netherlands',37,543.3,106,24474.3,1539792000,-3.2,3),(1539846000,'netherlands',37,407.2,113,24583.8,1539846000,-0.1,2),(1539853200,'netherlands',37,435.7,168,24604.9,1539853200,3.5,2),(1539864000,'netherlands',37,507.1,173,24607.3,1539860400,9.9,3),(1539874800,'netherlands',37,499.6,155,24599.8,1539871200,8.1,2),(1539878400,'netherlands',37,478.7,136,24598.5,1539878400,5.5,2),(1539885600,'netherlands',37,394.5,123,24614.3,1539882000,5.2,3),(1539889200,'netherlands',37,369.5,118,24625.5,1539889200,4.3,5),(1539928800,'netherlands',37,245.7,92,24618.4,1539928800,-1.6,9),(1539943200,'netherlands',37,414.7,111,24624.2,1539943200,1.1,9),(1539950400,'netherlands',0,0,0,0,0,0,0),(1539795600,'usa',75,1561.65,163.23,NULL,1539770793,-28.02,5),(1539846000,'usa',220,1942.78,577.31,NULL,1539846956,18.21,5),(1539853200,'usa',299,2556.63,774.98,NULL,1539854121,17.85,7),(1539864000,'usa',355,5179.53,866.73,NULL,1539863186,-37.63,10),(1539874800,'usa',407,8061.74,1015.2,NULL,1539873931,-60.05,7),(1539878400,'usa',457,9025.09,1181.97,NULL,1539879373,-48.23,7),(1539885600,'usa',510,10066.8,1384.52,NULL,1539886238,-40.01,10),(1539889200,'usa',554,10842.9,1590.21,NULL,1539890572,-26.9,31),(1539928800,'usa',600,5716.11,1311.24,NULL,1539929739,104.57,50),(1539943200,'usa',600,8208.37,1332.63,NULL,1539929739,-173.24,50),(1539950400,'usa',751,12502.3,1712.02,NULL,1539946889,-328.95,52);
/*!40000 ALTER TABLE `stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weather`
--

DROP TABLE IF EXISTS `weather`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `weather` (
  `geohash5` varchar(32) NOT NULL,
  `geohash3` varchar(32) NOT NULL,
  `lat` float NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `lng` float NOT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `fromHour` int(10) unsigned NOT NULL,
  `altitude` float DEFAULT NULL,
  `fogPercent` float DEFAULT NULL,
  `pressureHPA` float DEFAULT NULL,
  `cloudinessPercent` float DEFAULT NULL,
  `windDirectionDeg` float DEFAULT NULL,
  `dewpointTemperatureC` float DEFAULT NULL,
  `windGustMps` float DEFAULT NULL,
  `humidityPercent` float DEFAULT NULL,
  `areaMaxWindSpeedMps` float DEFAULT NULL,
  `windSpeedMps` float DEFAULT NULL,
  `temperatureC` float DEFAULT NULL,
  `lowCloudsPercent` float DEFAULT NULL,
  `mediumCloudsPercent` float DEFAULT NULL,
  `highCloudsPercent` float DEFAULT NULL,
  `temperatureProbability` float DEFAULT NULL,
  `windProbability` float DEFAULT NULL,
  `updatedTimestamp` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`fromHour`,`geohash3`,`geohash5`,`sourceApi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weather`
--

LOCK TABLES `weather` WRITE;
/*!40000 ALTER TABLE `weather` DISABLE KEYS */;
/*!40000 ALTER TABLE `weather` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weather_monitoring`
--

DROP TABLE IF EXISTS `weather_monitoring`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `weather_monitoring` (
  `geohash5` varchar(32) NOT NULL,
  `geohash3` varchar(32) NOT NULL,
  `lat` float NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `lng` float NOT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `fromHour` int(10) unsigned NOT NULL,
  `altitude` float DEFAULT NULL,
  `fogPercent` float DEFAULT NULL,
  `pressureHPA` float DEFAULT NULL,
  `cloudinessPercent` float DEFAULT NULL,
  `windDirectionDeg` float DEFAULT NULL,
  `dewpointTemperatureC` float DEFAULT NULL,
  `windGustMps` float DEFAULT NULL,
  `humidityPercent` float DEFAULT NULL,
  `areaMaxWindSpeedMps` float DEFAULT NULL,
  `windSpeedMps` float DEFAULT NULL,
  `temperatureC` float DEFAULT NULL,
  `lowCloudsPercent` float DEFAULT NULL,
  `mediumCloudsPercent` float DEFAULT NULL,
  `highCloudsPercent` float DEFAULT NULL,
  `temperatureProbability` float DEFAULT NULL,
  `windProbability` float DEFAULT NULL,
  `updatedTimestamp` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`fromHour`,`geohash3`,`geohash5`,`sourceApi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weather_monitoring`
--

LOCK TABLES `weather_monitoring` WRITE;
/*!40000 ALTER TABLE `weather_monitoring` DISABLE KEYS */;
/*!40000 ALTER TABLE `weather_monitoring` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-19 15:38:17
