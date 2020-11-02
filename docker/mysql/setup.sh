#!/bin/sh

#FIXME this is just a temporary measure
MYSQL_CMD="mysql -uroot -proot"

count=$(${MYSQL_CMD} -N -e "select count(*) from mysql.user where user = 'galaxy';")
if [ $count -eq 1 ]
then
  echo "DROP USER 'galaxy'@'%';" | $MYSQL_CMD
fi

count=$(${MYSQL_CMD} -N -e "select count(*) from mysql.user where user = 'galaxy_test';")
if [ $count -eq 1 ]
then
  echo "DROP USER 'galaxy_test'@'%';" | $MYSQL_CMD
fi

echo "CREATE USER 'galaxy'@'%' identified with mysql_native_password by 'galaxypassword';" | $MYSQL_CMD
echo "CREATE USER 'galaxy_test'@'%' identified with mysql_native_password by 'galaxy_test_pw';" | $MYSQL_CMD
echo "GRANT ALL ON galaxy.* to 'galaxy'@'%';" | $MYSQL_CMD
echo "GRANT ALL ON galaxy_test.* to 'galaxy_test'@'%';" | $MYSQL_CMD
echo "FLUSH PRIVILEGES" | $MYSQL_CMD

echo "CREATE DATABASE galaxy;" | $MYSQL_CMD
echo "CREATE DATABASE galaxy_test;" | $MYSQL_CMD