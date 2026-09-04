import React from 'react'
import KitchenOwnerNavbar from './KitchenOwnerNavbar'
import OrderChart from './OrderChart'

const KitchenOwnerDashboard = () => {
  return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <KitchenOwnerNavbar/>
      <main className="mt-4 ml-6 mr-6 pt-20 md:pt-4 flex-1 text-white">
        <p className="mb-4 text-4xl font-bold">Ordering chart</p>
        <div className="h-[500px] w-full overflow-x-auto">
          <OrderChart />
        </div>
      </main>
    </div>
  )
}

export default KitchenOwnerDashboard
