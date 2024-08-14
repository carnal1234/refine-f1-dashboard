import { Empty, Select, Skeleton, Table } from 'antd';
import React, { useEffect, useState } from 'react'


const StandingTable = () => {


  enum StandingType {
    DRIVER = "driverStandings",
    CONSTRUCTOR = "constructorStandings"
  }


  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState<string>('2024');
  const [standingType, setStandingType] = useState<string>(StandingType.DRIVER)

  const handleYearChange = (value: string) => setYear(value)

  const handleStandingChange = (value: string) => setStandingType(value)

  



  async function fetchData() {
    let url = `http://ergast.com/api/f1/${year}/${standingType}.json`
    setIsLoading(true)
    fetch(url)
      .then(res => {
        return res.json()
      })
      .then(json => {
        let data = []
        switch (standingType) {
          case StandingType.DRIVER:
            data = json.MRData.StandingsTable.StandingsLists[0].DriverStandings
            break

          case StandingType.CONSTRUCTOR:
            data = json.MRData.StandingsTable.StandingsLists[0].ConstructorStandings
            break

        }
        setData(data)

      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false))
  }

  // console.log(data)

  useEffect(() => {
    fetchData();

    // setData(mockJson.MRData.StandingsTable.StandingsLists[0].DriverStandings);
  }, [year, standingType])

  return (
    <>
      <Select
        placeholder="Select year"
        defaultValue="2024"
        style={{ width: 120, margin: 20 }}
        onChange={handleYearChange}
        options={[
          { value: '2023' },
          { value: '2024' },
        ]}
      />

      <Select
        placeholder="Select Standing"
        defaultValue={StandingType.DRIVER}
        style={{ width: 120, margin: 20 }}
        onChange={handleStandingChange}
        options={[
          { value: StandingType.DRIVER, label: "Driver Standing" },
          { value: StandingType.CONSTRUCTOR, label: "Constructor Standing" },
        ]}
      />

      <Table dataSource={isLoading ? [] : data}
        locale={{
          emptyText: isLoading ? <Skeleton active={true} /> : <Empty />
        }}>
        {standingType === StandingType.DRIVER ?

          (
            <>
              <Table.Column dataIndex="position" title="Pos" />
              <Table.Column dataIndex={["Driver"]} title="Driver"

                render={(_, record: any) => { return record.Driver.givenName + " " + record.Driver.familyName; }
                }

              />
              <Table.Column dataIndex={["Driver", "permanentNumber"]} title="Driver No." />
              <Table.Column dataIndex={["Driver", "nationality"]} title="Nationality" />

              <Table.Column dataIndex={["Constructors", "0", "name"]} title="Car" />
              <Table.Column dataIndex="points" title="Pts" />
            </>
          ) :
          (
            <>
              <Table.Column dataIndex="position" title="Pos" />
              <Table.Column dataIndex={["Constructor", "name"]} title="Team" />
              <Table.Column dataIndex="points" title="Pts" />
            </>

          )
        }

      </Table>
    </>

  )
}

export default StandingTable
