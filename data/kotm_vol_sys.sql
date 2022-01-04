-- MySQL dump 10.17  Distrib 10.3.25-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: mysql.kotm.org    Database: kotm_vol_sys
-- ------------------------------------------------------
-- Server version	5.7.28-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account` (
  `uname` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `admin` enum('1','0') NOT NULL DEFAULT '0',
  `createDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastLoginDate` timestamp NULL DEFAULT NULL,
  `firstname` varchar(50) NOT NULL DEFAULT '',
  `lastname` varchar(50) NOT NULL DEFAULT '',
  `email` varchar(50) NOT NULL DEFAULT '',
  `address1` varchar(100) NOT NULL DEFAULT '',
  `address2` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL DEFAULT '',
  `state` char(2) NOT NULL DEFAULT '',
  `zip` varchar(5) NOT NULL DEFAULT '',
  `phone1` varchar(15) NOT NULL DEFAULT '',
  `phone2` varchar(15) DEFAULT NULL,
  `birthdate` date NOT NULL DEFAULT '0000-00-00',
  `student` enum('1','0') NOT NULL DEFAULT '0',
  `school` varchar(100) DEFAULT NULL,
  `howHeardAbout` text,
  `emergencyRelationship` varchar(255) NOT NULL DEFAULT '',
  `emergencyPhone` varchar(15) NOT NULL DEFAULT '',
  `emergencyName` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`uname`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES ('jmerrill','$2y$10$2hE16ORFiDSlD0NZrErrbOA2y6FsNRbwbQ1Sbnx6EsypYHL9dJZ6W','1','2020-02-05 19:01:09','2021-03-02 01:23:40','Jason','Merrill','jmerrill@kotm.org','10321 Golden Willow Dr','','Sandy','UT','84070','801-613-0856','','1978-12-08','0','','','Spouse','617-749-7073','Lauren Palmer-Merrill');
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_account`
--

DROP TABLE IF EXISTS `dev_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_account` (
  `uname` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `admin` enum('1','0') NOT NULL DEFAULT '0',
  `createDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastLoginDate` timestamp NULL DEFAULT NULL,
  `firstname` varchar(50) NOT NULL DEFAULT '',
  `lastname` varchar(50) NOT NULL DEFAULT '',
  `email` varchar(50) NOT NULL DEFAULT '',
  `address1` varchar(100) NOT NULL DEFAULT '',
  `address2` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL DEFAULT '',
  `state` char(2) NOT NULL DEFAULT '',
  `zip` varchar(5) NOT NULL DEFAULT '',
  `phone1` varchar(15) NOT NULL DEFAULT '',
  `phone2` varchar(15) DEFAULT NULL,
  `birthdate` date NOT NULL DEFAULT '0000-00-00',
  `student` enum('1','0') NOT NULL DEFAULT '0',
  `school` varchar(100) DEFAULT NULL,
  `howHeardAbout` text,
  PRIMARY KEY (`uname`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dev_info`
--

DROP TABLE IF EXISTS `dev_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_info` (
  `type` varchar(32) NOT NULL DEFAULT '',
  `name` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_info`
--

LOCK TABLES `dev_info` WRITE;
/*!40000 ALTER TABLE `dev_info` DISABLE KEYS */;
INSERT INTO `dev_info` VALUES ('volunteers_admin','Sydnee Ochoa','Volunteer Coordinator','801-221-9930 x105','sochoa@kotm.org'),('website_admin','Jonathan Krein','','843-861-3410','jonathankrein@gmail.com');
/*!40000 ALTER TABLE `dev_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_specialEventDate`
--

DROP TABLE IF EXISTS `dev_specialEventDate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_specialEventDate` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT '0000-00-00',
  `hasStartEndTime` enum('1','0') NOT NULL DEFAULT '0',
  `startTime` time NOT NULL DEFAULT '00:00:00',
  `endTime` time NOT NULL DEFAULT '00:00:00',
  `location` text NOT NULL,
  `shortDescription` text NOT NULL,
  `longDescription` text NOT NULL,
  `volunteersNeeded` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `dev_specialEventVolunteer`
--

DROP TABLE IF EXISTS `dev_specialEventVolunteer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_specialEventVolunteer` (
  `uname` varchar(20) NOT NULL DEFAULT '',
  `volunteerDateId` int(10) unsigned NOT NULL DEFAULT '0',
  `signupDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmId` varchar(20) DEFAULT NULL,
  `confirmed` timestamp NULL DEFAULT NULL,
  `showed` enum('1','0') DEFAULT NULL,
  PRIMARY KEY (`uname`,`volunteerDateId`),
  KEY `volunteerDateId` (`volunteerDateId`),
  CONSTRAINT `dev_specialEventVolunteer_ibfk_1` FOREIGN KEY (`uname`) REFERENCES `dev_account` (`uname`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dev_specialEventVolunteer_ibfk_2` FOREIGN KEY (`volunteerDateId`) REFERENCES `dev_specialEventDate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_specialEventVolunteer`
--

LOCK TABLES `dev_specialEventVolunteer` WRITE;
/*!40000 ALTER TABLE `dev_specialEventVolunteer` DISABLE KEYS */;
INSERT INTO `dev_specialEventVolunteer` VALUES ('hbomb',10,'2017-06-09 21:12:43',NULL,NULL,NULL),('jkrein',1,'2016-12-06 02:51:23',NULL,NULL,'1'),('jkrein',2,'2016-12-14 03:46:06',NULL,NULL,NULL),('jkrein',4,'2017-08-21 20:32:48','BQ97nxWeZYfaKeGDnIV2','2017-08-25 00:02:16',NULL),('jkrein',6,'2017-08-24 23:27:30',NULL,NULL,NULL),('jkrein',9,'2017-08-04 20:00:39','HFZ80DRgeB8Hq3kYysi7','2017-08-07 19:07:32',NULL),('jkrein',10,'2017-01-31 17:46:22','CMXvfQIjyFdwe4gNBTxg','2017-08-18 19:22:24',NULL),('jkrein',26,'2017-08-25 00:14:10',NULL,NULL,NULL),('jkrein3',4,'2017-04-15 23:17:23','fENxvgqz4DlEYatiqrwO',NULL,'1'),('smbean2010',26,'2017-08-15 01:19:12',NULL,NULL,NULL),('sochoa',7,'2017-08-09 22:15:29',NULL,NULL,NULL);
/*!40000 ALTER TABLE `dev_specialEventVolunteer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_transactionCounter`
--

DROP TABLE IF EXISTS `dev_transactionCounter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_transactionCounter` (
  `lastIssuedId` bigint(20) unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_transactionCounter`
--

LOCK TABLES `dev_transactionCounter` WRITE;
/*!40000 ALTER TABLE `dev_transactionCounter` DISABLE KEYS */;
INSERT INTO `dev_transactionCounter` VALUES (12521);
/*!40000 ALTER TABLE `dev_transactionCounter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_usedTransactions`
--

DROP TABLE IF EXISTS `dev_usedTransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_usedTransactions` (
  `transId` bigint(20) unsigned NOT NULL,
  `dateUsed` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_usedTransactions`
--

LOCK TABLES `dev_usedTransactions` WRITE;
/*!40000 ALTER TABLE `dev_usedTransactions` DISABLE KEYS */;
INSERT INTO `dev_usedTransactions` VALUES (12493,'2019-06-03 23:42:24'),(12497,'2019-06-03 23:42:29'),(12499,'2019-06-03 23:42:49'),(12497,'2019-06-03 23:43:16'),(12513,'2019-06-03 23:43:52');
/*!40000 ALTER TABLE `dev_usedTransactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_volunteer`
--

DROP TABLE IF EXISTS `dev_volunteer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_volunteer` (
  `uname` varchar(20) NOT NULL DEFAULT '',
  `volunteerDateId` int(10) unsigned NOT NULL DEFAULT '0',
  `signupDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmId` varchar(20) DEFAULT NULL,
  `confirmed` timestamp NULL DEFAULT NULL,
  `showed` enum('1','0') DEFAULT NULL,
  PRIMARY KEY (`uname`,`volunteerDateId`),
  KEY `volunteerDateId` (`volunteerDateId`),
  CONSTRAINT `dev_volunteer_ibfk_1` FOREIGN KEY (`uname`) REFERENCES `dev_account` (`uname`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dev_volunteer_ibfk_2` FOREIGN KEY (`volunteerDateId`) REFERENCES `dev_volunteerDate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_volunteer`
--

LOCK TABLES `dev_volunteer` WRITE;
/*!40000 ALTER TABLE `dev_volunteer` DISABLE KEYS */;
INSERT INTO `dev_volunteer` VALUES ('dmcneill',10,'2017-01-07 19:53:24',NULL,NULL,NULL),('dmcneill',11,'2017-01-07 19:55:25',NULL,NULL,NULL),('dmcneill',12,'2017-01-07 19:56:39','bMrKAsO1dxvv3H2uP5IP',NULL,NULL),('jkrein',1,'2016-12-05 00:34:04','EpSOIOpMLYCRNpxm3lG2','2016-12-06 04:05:58',NULL),('jkrein',3,'2016-12-14 03:41:49',NULL,NULL,NULL),('jkrein',4,'2016-12-14 05:24:14',NULL,NULL,NULL),('jkrein',11,'2017-01-13 15:19:27',NULL,NULL,NULL),('jkrein',15,'2016-12-01 00:00:00',NULL,NULL,NULL),('jkrein',19,'2017-08-10 20:06:57','K6Bm5GhG2i5L3Yiy0dxw','2017-08-25 00:01:43',NULL),('jkrein',25,'2017-08-10 20:07:08','1ZGHkYjhmRn1qMVEhKE8','2017-08-10 20:08:55',NULL),('jkrein',31,'2019-06-03 23:42:49','jQyChpXbRxkhfwjjZP26','2019-06-03 23:44:22',NULL),('jkrein2',1,'2016-12-06 03:39:15','1CSJQ3xmJ4nS6ENLlkzO','2016-12-06 04:07:07',NULL),('jkrein2',4,'2016-12-14 05:43:10',NULL,NULL,NULL),('sochoa',13,'2017-01-10 15:47:07',NULL,NULL,NULL),('sochoa',16,'2016-12-02 00:00:00',NULL,NULL,'0');
/*!40000 ALTER TABLE `dev_volunteer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_volunteerDate`
--

DROP TABLE IF EXISTS `dev_volunteerDate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_volunteerDate` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT '0000-00-00',
  `startTime` time NOT NULL DEFAULT '00:00:00',
  `endTime` time NOT NULL DEFAULT '00:00:00',
  `type` varchar(50) NOT NULL DEFAULT '',
  `location` varchar(50) NOT NULL DEFAULT '',
  `volunteersNeeded` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `date time location` (`date`,`location`,`startTime`,`endTime`,`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_volunteerDate`
--

LOCK TABLES `dev_volunteerDate` WRITE;
/*!40000 ALTER TABLE `dev_volunteerDate` DISABLE KEYS */;
INSERT INTO `dev_volunteerDate` VALUES (1,'2016-12-12','18:00:00','21:30:00','Respite','Lehi',2),(2,'2016-12-12','18:00:00','21:30:00','Respite','Orem',3),(3,'2016-12-21','18:00:00','21:30:00','Respite','St. George',5),(4,'2016-12-21','18:00:00','21:30:00','Respite','Orem',3),(5,'2016-12-30','19:00:00','22:30:00','Respite','Lehi',7),(6,'2016-12-17','18:00:00','21:30:00','Respite','Salem',10),(7,'2016-12-17','19:00:00','21:30:00','Respite','Salem',5),(8,'2016-12-20','18:00:00','21:30:00','Respite','Salem',2),(10,'2017-01-08','18:00:00','21:30:00','Respite','Orem',1),(11,'2017-01-13','17:00:00','21:30:00','Respite','Orem',2),(12,'2017-01-11','18:00:00','21:30:00','Respite','Orem',1),(13,'2017-02-01','18:00:00','21:30:00','Respite','Orem',3),(15,'2016-12-13','17:00:00','21:30:00','Childcare','Orem',5),(16,'2016-12-02','18:00:00','21:30:00','Childcare','Orem',3),(17,'2017-02-02','18:00:00','21:30:00','Childcare','Lehi',3),(18,'2017-02-01','18:00:00','21:30:00','Respite','Lehi',3),(19,'2018-02-27','18:00:00','21:30:00','Childcare','St. George',3),(20,'2017-03-03','18:00:00','21:30:00','Respite','Lehi',1),(21,'2017-03-30','18:00:00','21:30:00','Respite','St. George',2),(22,'2018-12-12','18:00:00','21:30:00','Childcare','Lehi',1),(23,'2018-12-12','18:00:00','21:30:00','Respite','Lehi',3),(24,'2018-12-12','18:00:00','21:30:00','Respite','Orem',4),(25,'2018-12-12','18:00:00','21:30:00','Childcare','Salem',1),(26,'2018-12-12','18:30:00','21:00:00','Respite','Lehi',1),(29,'2017-08-11','18:00:00','21:30:00','Childcare','Lehi',3),(30,'2017-08-11','18:00:00','21:30:00','Respite','Lehi',3),(31,'2019-12-12','18:00:00','21:30:00','Childcare','Springville',20);
/*!40000 ALTER TABLE `dev_volunteerDate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `info`
--

DROP TABLE IF EXISTS `info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `info` (
  `type` varchar(32) NOT NULL DEFAULT '',
  `name` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `info`
--

LOCK TABLES `info` WRITE;
/*!40000 ALTER TABLE `info` DISABLE KEYS */;
INSERT INTO `info` VALUES ('volunteers_admin','Shannon Engberson Finch','Volunteer Coordinator','385-292-5628','volunteer@kotm.org'),('website_admin','Jonathan Krein','','843-861-3410','jonathankrein@gmail.com');
/*!40000 ALTER TABLE `info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialEventDate`
--

DROP TABLE IF EXISTS `specialEventDate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specialEventDate` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT '0000-00-00',
  `hasStartEndTime` enum('1','0') NOT NULL DEFAULT '0',
  `startTime` time NOT NULL DEFAULT '00:00:00',
  `endTime` time NOT NULL DEFAULT '00:00:00',
  `location` text NOT NULL,
  `shortDescription` text NOT NULL,
  `longDescription` text NOT NULL,
  `volunteersNeeded` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `specialEventVolunteer`
--

DROP TABLE IF EXISTS `specialEventVolunteer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specialEventVolunteer` (
  `uname` varchar(50) NOT NULL DEFAULT '',
  `volunteerDateId` int(10) unsigned NOT NULL DEFAULT '0',
  `signupDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmId` varchar(20) DEFAULT NULL,
  `confirmed` timestamp NULL DEFAULT NULL,
  `showed` enum('1','0') DEFAULT NULL,
  PRIMARY KEY (`uname`,`volunteerDateId`),
  KEY `volunteerDateId` (`volunteerDateId`),
  CONSTRAINT `specialEventVolunteer_ibfk_1` FOREIGN KEY (`uname`) REFERENCES `account` (`uname`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `specialEventVolunteer_ibfk_2` FOREIGN KEY (`volunteerDateId`) REFERENCES `specialEventDate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;



--
-- Table structure for table `transactionCounter`
--

DROP TABLE IF EXISTS `transactionCounter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactionCounter` (
  `lastIssuedId` bigint(20) unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactionCounter`
--

LOCK TABLES `transactionCounter` WRITE;
/*!40000 ALTER TABLE `transactionCounter` DISABLE KEYS */;
INSERT INTO `transactionCounter` VALUES (389816);
/*!40000 ALTER TABLE `transactionCounter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usedTransactions`
--

DROP TABLE IF EXISTS `usedTransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usedTransactions` (
  `transId` bigint(20) unsigned NOT NULL,
  `dateUsed` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;



--
-- Table structure for table `volunteer`
--

DROP TABLE IF EXISTS `volunteer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteer` (
  `uname` varchar(50) NOT NULL DEFAULT '',
  `volunteerDateId` int(10) unsigned NOT NULL DEFAULT '0',
  `signupDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmId` varchar(20) DEFAULT NULL,
  `confirmed` timestamp NULL DEFAULT NULL,
  `showed` enum('1','0') DEFAULT NULL,
  PRIMARY KEY (`uname`,`volunteerDateId`),
  KEY `volunteerDateId` (`volunteerDateId`),
  CONSTRAINT `volunteer_ibfk_1` FOREIGN KEY (`uname`) REFERENCES `account` (`uname`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `volunteer_ibfk_2` FOREIGN KEY (`volunteerDateId`) REFERENCES `volunteerDate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;



--
-- Table structure for table `volunteerDate`
--

DROP TABLE IF EXISTS `volunteerDate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteerDate` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT '0000-00-00',
  `startTime` time NOT NULL DEFAULT '00:00:00',
  `endTime` time NOT NULL DEFAULT '00:00:00',
  `type` varchar(50) NOT NULL DEFAULT '',
  `location` varchar(50) NOT NULL DEFAULT '',
  `volunteersNeeded` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`,`location`,`startTime`,`endTime`,`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1696 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-21 16:01:40
