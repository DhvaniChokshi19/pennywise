import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Cards from '../components/Cards';
import AddExpenseModal from '../components/Modals/addExpense';
import AddIncomeModal from '../components/Modals/addIncome';
import { toast } from 'react-toastify';
import {addDoc, collection, getDocs, query } from 'firebase/firestore';
import {auth, db }from "../firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import moment from 'moment';
import TransactionsTable from '../components/TransactionsTable';
import ChartComponent from '../components/Charts';
import NoTransactions from '../components/NoTransactions';
function Dashboard() {
  
  const [transactions,setTransactions]=useState([]);
  const [loading,setLoading]=useState(false);
  const [user ]=useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [income,setIncome]=useState(0);
  const [expense,setExpense]=useState(0);
  const[totalBalance,setTotalBalance]=useState(0);
  const showExpenseModal = () => {
    setIsExpenseModalVisible(true);
  };

  const showIncomeModal = () => {
    setIsIncomeModalVisible(true);
  };

  const handleExpenseCancel = () => {
    setIsExpenseModalVisible(false);
  };

  const handleIncomeCancel = () => {
    setIsIncomeModalVisible(false);
  };

  const onFinish = (values, type) => {
    const newTransaction = {
      type:type,
      date:values.date.format("YYYY-MM-DD"),
      amount:parseFloat(values.amount),
      tag:values.tag,
      name:values.name,
    };
    addTransaction(newTransaction);
  };
  async function addTransaction(transaction,many){
    //add the doc
    try{
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/transactions`),
        transaction
      );
      console.log("Document written with ID:",docRef.id);
       if(!many)toast.success("Transaction added")
        let newArr = transactions;
        newArr.push(transaction);
        setTransactions(newArr);
        cal_Balance();
    }catch(e){
      console.error("Error adding document:",e);
      if(!many) toast.error("Couldn't add transaction");
    }
  }

useEffect(() => {
  //get all docs from a collection
fetchTransactions();
  }, [user]);

useEffect(() => {
 cal_Balance()
  }, [transactions]);

const cal_Balance=()=>{
  let incomeTotal =0;
  let expenseTotal = 0;
  transactions.forEach((transaction)=>{
    if(transaction.type==="income"){
      incomeTotal+= transaction.amount;
    }else{
      expenseTotal+=transaction.amount;
    }
  });
  setIncome(incomeTotal);
  setExpense(expenseTotal);
  setTotalBalance(incomeTotal-expenseTotal);
};
  async function fetchTransactions(){
    setLoading(true);
    if(user){
      const q = query(collection(db,`users/${user.uid}/transactions`));
      const querySnapshot = await getDocs(q);
      let transactionsArray = [];
      querySnapshot.forEach((doc) => {
        //doc.data()is neveer underdefined for quey doc snapshots
        transactionsArray.push(doc.data());
      });
      setTransactions(transactionsArray);
      
      toast.success("Transaction Fetched");
    }
    setLoading(false);
  }
  
  let sortedTransactions= transactions.sort((a,b)=>{
      return new Date(a.date)-new Date(b.date);
  })


  return (
    <div>
      <Header />
      {loading?(<p>loading...</p>):(<>
      <Cards
      income={income}
      expense={expense}
      totalBalance={totalBalance}
        showExpenseModal={showExpenseModal} showIncomeModal={showIncomeModal} />

      <AddExpenseModal
        isExpenseModalVisible={isExpenseModalVisible}
        handleExpenseCancel={handleExpenseCancel}
        onFinish={onFinish}
      />
      <AddIncomeModal
        isIncomeModalVisible={isIncomeModalVisible}
        handleIncomeCancel={handleIncomeCancel}
        onFinish={onFinish}
      />
            {transactions && transactions.length !== 0 ? (
        <ChartComponent sortedTransactions={sortedTransactions}/>):(
          <NoTransactions />
        )}

      <TransactionsTable transactions={transactions} addTransaction={addTransaction} fetchTransactions={fetchTransactions}/>
      </>)}
    </div>
  );
}

export default Dashboard;