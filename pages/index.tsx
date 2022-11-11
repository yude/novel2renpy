import Head from 'next/head'
import { stringify } from 'querystring';
import * as React from "react"
import { useState } from "react"
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import styles from '../styles/Home.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faInfo } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  let [value, setValue] = useState('');
  let [splitter, setSplitter] = useState('');
  let [temp, setTemp] = useState('aaaa');

  let [character, setCharacter] = useState([{ name: "ナレーション", renpy: "narrator" }])

  // define raw lines
  let lines: string[] = []

  // define parsed lines
  let parent_lines: string[] = []
  let parsed_lines_chara: string[] = []
  let parsed_lines_dialogue: string[] = []

  function updateCharacterRenPy(name: string, new_renpy: string) {
    const newCharacterState = character.map(obj => {
      if (obj.name === name) {
        return { ...obj, renpy: new_renpy }
      }
      return obj
    })

    setCharacter(newCharacterState)
  }

  React.useEffect(() => {
    let source: string = value
    let render_lines: string = ""
    source = source.replace(/\t/d, '')
    source = source.replace(/\u3000/g, '')
    source = source.replace(/	/g, '')
    lines = source.split('\n')

    // reset variables
    parsed_lines_chara = []
    parsed_lines_dialogue = []

    // parse lines
    const blocks = source.split('\n\n')
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].split('\n')
      let block_chara_source: string = ""
      let block_chara: string[] = []
      let block_dialogue: string[] = []

      for (let j = 0; j < block.length; j++) {
        if (block[j] !== "") {
          const splitters = splitter.split('')
          let isComment: boolean = false
          if (block[j] !== "") {

            // check whether if this line is comment
            for (let k = 0; k < splitters.length; k++) {
              if (block[j].includes(splitters[k])) {
                isComment = true
                break
              }
            }

            if (isComment) { // if this line in block is comment
              block_chara.push("comment")
              block_dialogue.push(block[j])
            } else {
              if (block[j].includes("「")) { // if this line in block is dialogue
                const pos_dialogue: number = block[j].indexOf('「')
                block_chara.push(block[j].slice(0, pos_dialogue))
                block_dialogue.push(block[j].slice(pos_dialogue))
              } else {
                block_chara.push("ナレーション")
                block_dialogue.push(block[j])
              }
            }

          }
        }

        // retrieve this block's character source
        for (let j = 0; j < block.length; j++) {
          if (block_chara[j] !== "") {
            block_chara_source = block_chara[j]
            break
          }
        }

        // set unknown character to predictable character
        for (let j = 0; j < block.length; j++) {
          if (block_chara[j] === "") {
            block_chara[j] = block_chara_source
            break
          }
        }
      }

      for (let j = 0; j < block_chara.length; j++) {
        parsed_lines_chara.push(block_chara[j])
        parsed_lines_dialogue.push(block_dialogue[j])
      }
    }

    let character_list = Array.from(new Set(parsed_lines_chara))
    character_list = character_list.filter(function (e) { return e !== 'ナレーション' })
    character_list = character_list.filter(function (e) { return e !== '' })

    if (value !== "") {
      const index = character.indexOf(character.filter(obj => obj.name == "ナレーション")[0])
      render_lines += "# キャラクターを定義\n"

      render_lines += "define " + character[index].renpy + " = Character('')\n"
    }
    for (let i = 0; i < character_list.length; i++) {
      const index = character.findIndex((item) => item.name === character_list[i])
      if (index == -1) {
        if (character_list[i] !== "comment") {
          render_lines += "define " + character_list[i] + " = Character('" + character_list[i] + "')\n"

          setCharacter(
            (p) => ([
              ...p,
              {
                name: character_list[i],
                renpy: "",
                index: character.indexOf(character.filter(obj => obj.name == character_list[i])[0])
              }
            ])
          )
        }
      } else {
        if (character_list[i] !== "comment") {
          if (character[index].renpy == "") {
            render_lines += "define " + character[index].name + " = Character('" + character_list[i] + "')\n"
          } else {
            render_lines += "define " + character[index].renpy + " = Character('" + character_list[i] + "')\n"
          }
        }
      }
    }

    if (value !== "") {
      render_lines += "\n# ストーリーの記述\n"
    }

    // render lines
    for (let i = 0; i < parsed_lines_chara.length; i++) {
      if (parsed_lines_chara[i] === "comment") {
        render_lines += "# " + parsed_lines_dialogue[i] + "\n"
      } else {
        // retrieve character name
        if (parsed_lines_chara[i] === "") {
          const filtered = character.filter(obj => {
            return obj.name === "ナレーション"
          })
          if (filtered[0].renpy === "") {
            render_lines += filtered[0].name
          } else {
            render_lines += filtered[0].renpy
          }
        } else {
          const filtered = character.filter(obj => obj.name == parsed_lines_chara[i])
          if (filtered[0]) {
            if (filtered[0].renpy === "") {
              render_lines += filtered[0].name
            } else {
              render_lines += filtered[0].renpy
            }
          }
        }

        // retrieve dialogue
        render_lines += " \""
        render_lines += parsed_lines_dialogue[i]
        render_lines += "\""
        render_lines += "\n"
      }
    }
    setTemp(render_lines)
  }, [value, character, splitter])

  return (
    <div className={styles.container}>
      <Head>
        <title>novel2renpy</title>
        <meta name="description" content="novel2renpy: ノベルゲームの原稿を Ren'Py のソースコードに変換します。" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h3 className="mt-5">novel2renpy</h3>
        <h6>ノベルゲームの原稿を Ren'Py のソースコードに変換します。</h6>
        <div className="container mt-5">
          <div className="row">
            <div className="col-6">
              <Form.Control type="email" placeholder="ここに原稿を入力 または ペースト..." as="textarea" onChange={(event) => setValue(event.target.value)} rows={20} />
            </div>
            <div className="col-6">
              <Form.Control style={{ fontFamily: "monospace" }} value={temp} disabled placeholder="ここに変換済みのソースコードが表示されます。" as="textarea" rows={20} />
              <Button variant="primary" className="mt-2" onClick={() => { navigator.clipboard.writeText(temp) }}><FontAwesomeIcon icon={faClipboard} width={20} height={20} /> コピーする</Button>
            </div>
          </div>
        </div>
        <div className="container mt-4">
          <Form.Label>コメントとして解釈する行の設定</Form.Label>
          <Form.Text className="text-muted">
            &nbsp;次の文字 (記号) が含まれている行は、コメントとして解釈します。
          </Form.Text>
          <Form.Control onChange={(event) => setSplitter(event.target.value)} placeholder="連続して入力することで、複数個指定できます。(例: *＊#)" />
          <Form.Label className="mt-3">キャラクター名と Ren'Py 内のキャラクター定義の対応の設定</Form.Label>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>キャラクター名</th>
                <th>Ren'Py コード内での定義</th>
              </tr>
            </thead>
            <tbody>
              {character.map((obj, index) => {
                return (
                  <tr key={index}>
                    <td>{obj.name}</td>
                    <td><Form.Control placeholder={obj.name} onChange={(event) => updateCharacterRenPy(obj.name, event.target.value)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>

          <hr />
          <p><FontAwesomeIcon icon={faInfo} width={20} height={20} transform="up-3" /> 入力した内容はすべてブラウザ内で処理され、外部のサーバー等に送信されることはありません。</p>
          <p>&copy; 2022 yude &lt;i[at]yude.jp&gt;. / <a href="https://github.com/yude/novel2renpy/blob/master/LICENSE">MIT License</a>. / GitHub: <a href="https://github.com/yude/novel2renpy">yude/novel2renpy</a></p>
        </div>
      </main>
    </div>
  )
}
