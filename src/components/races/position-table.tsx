import React from 'react'
import { PositionParams } from '@/interfaces/openf1'

import { groupBy } from '@/utilities/helper'

export const RacePositionTable = (props: { positionData: Array<PositionParams>, driverAcronym: any, isLoading: boolean }) => {

    const positionGroupByDriverNumber = groupBy(props.positionData, i => i.driver_number!)


    return (
        <div>



        </div>
    )
}

