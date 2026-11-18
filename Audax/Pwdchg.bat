ECHO OFF
REM ****************************** CUSTOMIZE FOLLOWING LINES *************************
SET JAVA_HOME=D:\jdk1.8-x64\jdk1.8-x64
SET APPLICATION_DIR=D:\PassWordChangeUtilty_DBUSER\PassWordChangeUtilty_DBUSER\PwdChg
SET APPLICATION_HOME=%APPLICATION_DIR%

ECHO %JAVA_HOME%
ECHO %APPLICATION_DIR%
ECHO %APPLICATION_HOME%
 
REM *********************************DO NOT CHANGE FOLLOWING LINES ****************************** 
SET PATH=%JAVA_HOME%\bin;
SET CLASSPATH=%APPLICATION_HOME%;%APPLICATION_HOME%/jars/classes12.jar;%APPLICATION_HOME%/jars/FrameWork.jar;%APPLICATION_HOME%/jars/sqljdbc.jar;%APPLICATION_HOME%/jars/Archs.jar;%APPLICATION_HOME%/jars/Batch.jar;%APPLICATION_HOME%/jars/sqljdbc.jar;.;
ECHO %CLASSPATH%
java -Xmx512m com.infosys.bankaway.batch.pwdchg.Pwdchg sarvagnya BAS11PH1 ececuser Edgeuser_12345

PAUSE