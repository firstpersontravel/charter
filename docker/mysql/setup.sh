#!/bin/sh

#FIXME this is just a temporary measure
MYSQL_CMD="mysql -uroot -proot"

count=$(${MYSQL_CMD} -N -e "select count(*) from mysql.user where user = 'charter';")
if [ $count -eq 1 ]
then
  echo "DROP USER 'charter'@'%';" | $MYSQL_CMD
fi

count=$(${MYSQL_CMD} -N -e "select count(*) from mysql.user where user = 'charter_test';")
if [ $count -eq 1 ]
then
  echo "DROP USER 'charter_test'@'%';" | $MYSQL_CMD
fi

echo "CREATE USER 'charter'@'%' identified with caching_sha2_password by 'charterpassword';" | $MYSQL_CMD
echo "CREATE USER 'charter_test'@'%' identified with caching_sha2_password by 'charter_test_pw';" | $MYSQL_CMD
echo "GRANT ALL ON charter.* to 'charter'@'%';" | $MYSQL_CMD
echo "GRANT ALL ON charter_test.* to 'charter_test'@'%';" | $MYSQL_CMD
echo "FLUSH PRIVILEGES" | $MYSQL_CMD

echo "CREATE DATABASE charter;" | $MYSQL_CMD
echo "CREATE DATABASE charter_test;" | $MYSQL_CMD
